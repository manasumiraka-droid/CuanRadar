// CuanRadar — src/lib/scan.ts
// State machine scan (PRD §62, ARCHITECTURE §2) + Quick Scan DB-first (PRD §11) + polling abstraction.
//
// CATATAN (BUILD 3 frontend): API scan via edge function (`POST /api/scan`, `GET /api/scan/:id`)
// belum ada di repo (hanya CLI + engine). Modul ini menyediakan:
//   - runQuickScanLocal(): eksekusi Quick Scan nyata SISI-KLIEN dari data reward_apps (DB-first,
//     cek kecukupan PRD §14) — hasil nyata, tidak mengarang.
//   - useScanPoll(): polling abstraction yang MEMBACA scan_history bila ada & user login (state nyata),
//     dan jika tidak ada (mis. belum login / API belum ada) menyelesaikan via hasil lokal.
// Saat edge function aktif, cukup ganti sumber polling → GET /api/scan/:id; antarmuka tetap sama.
import { useEffect, useRef, useState } from 'react'
import type { Platform, ScanPollResult, ScanStage, ScanState, Category } from '../types'
import { supabase } from './supabase'

// Langkah progres UI (subset state machine, berurutan). 'ranking' adalah langkah terakhir sebelum selesai.
export const SCAN_STAGES: ScanStage[] = [
  'queued',
  'checking_cache',
  'discovering',
  'filtering',
  'extracting',
  'verifying',
  'calculating',
  'ranking',
]

export const STAGE_LABELS: Record<ScanStage, { icon: string; label: string }> = {
  queued: { icon: '🕒', label: 'Antrian' },
  checking_cache: { icon: '🔎', label: 'Memeriksa cache & database' },
  discovering: { icon: '🛰️', label: 'Mencari peluang baru' },
  filtering: { icon: '🧹', label: 'Menyaring kandidat' },
  extracting: { icon: '📝', label: 'Mengekstrak informasi' },
  verifying: { icon: '🛡️', label: 'Memverifikasi sumber' },
  calculating: { icon: '🧮', label: 'Menghitung nilai' },
  ranking: { icon: '📊', label: 'Menyusun peringkat' },
}

export const STATE_LABELS: Record<ScanState, string> = {
  queued: 'Dalam antrian',
  checking_cache: 'Memeriksa cache & database',
  discovering: 'Mencari peluang baru',
  filtering: 'Menyaring kandidat',
  extracting: 'Mengekstrak informasi',
  verifying: 'Memverifikasi sumber',
  calculating: 'Menghitung nilai',
  ranking: 'Menyusun peringkat',
  completed: 'Selesai',
  cache_completed: 'Selesai (dari cache/database)',
  limited: 'Hasil terbatas',
  failed: 'Gagal',
}

export function stageIndex(s: ScanStage): number {
  return SCAN_STAGES.indexOf(s)
}

// Langkah yang sedang aktif dari sebuah state (untuk ditampilkan di stepper).
export function activeStage(state: ScanState): ScanStage | 'done' {
  if (state === 'completed' || state === 'cache_completed') return 'done'
  if (state === 'limited') return 'ranking'
  if (state === 'failed') return 'filtering' // gagal biasanya saat verifikasi/extraction
  if (SCAN_STAGES.includes(state as ScanStage)) return state as ScanStage
  return 'queued'
}

// ——— Quick Scan DB-first (PRD §11, §14) ———
export const MIN_PER_CATEGORY: Record<Category, number> = { entertainment: 4, shopping: 4, wallet: 2, lainnya: 2 }
export const MIN_ALL = 12 // 4+4+2+2

export function countByCategory(platforms: Platform[], category: Category | 'all'): number {
  return category === 'all' ? platforms.length : platforms.filter((p) => p.category === category).length
}

export function minNeeded(category: Category | 'all'): number {
  return category === 'all' ? MIN_ALL : MIN_PER_CATEGORY[category]
}

export function isSufficient(platforms: Platform[], category: Category | 'all'): boolean {
  return countByCategory(platforms, category) >= minNeeded(category)
}

/**
 * Quick Scan DB-first (sisi klien): hasil dari data reward_apps yang sudah ada.
 * Ini jalur NYATA tanpa AI/search — sejalan engine/scan.mjs (runQuickScan → cache_completed bila cukup).
 * Bila data kurang, return 'limited' + hasil yang ada (jujur, tidak mengarang — PRD §13/§15).
 */
export function runQuickScanLocal(platforms: Platform[], category: Category | 'all'): ScanPollResult {
  const results = category === 'all' ? platforms : platforms.filter((p) => p.category === category)
  const sufficient = isSufficient(platforms, category)
  return {
    id: `local-${Date.now()}`,
    state: sufficient ? 'cache_completed' : results.length > 0 ? 'limited' : 'limited',
    source: 'database',
    results,
    candidates: 0,
  }
}

// ——— Scan via edge function (server-side; BUILD 3) ———
// Konsumsi kuota terjadi SERVER-SIDE (edge function memeriksa & menambah scan_credits)
// hanya ketika scan benar-benar berjalan — bukan saat klik tombol (PRD §39 v1.2).

export interface ScanStartInput {
  type: 'quick' | 'deep'
  category: Category | 'all'
}

/** Jalankan scan lewat Supabase edge function `/scan`. Fallback: caller pakai runQuickScanLocal bila tidak dikonfigurasi. */
export async function startScanRemote(input: ScanStartInput): Promise<ScanPollResult> {
  if (!supabase) throw new Error('supabase-not-configured')
  const { data, error } = await supabase.functions.invoke('scan', {
    body: { action: 'scan', ...input },
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  if (error) throw new Error(error.message || 'scan failed')
  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(String(data.error))
  const d = (data ?? {}) as { id?: string; state?: ScanState; source?: string; results?: Platform[]; candidates?: number }
  return {
    id: d.id ?? `scan-${Date.now()}`,
    state: d.state ?? 'completed',
    source: d.source === 'search' ? 'search' : 'database',
    results: d.results ?? [],
    candidates: d.candidates ?? 0,
  }
}

// ——— Polling abstraction ———
// Membaca scan_history bila ada & user login; jika tidak (API/local), selesaikan dengan hasil lokal.
// Ketika edge function aktif: replace `pollOnce` untuk memanggil GET /api/scan/:id dan mem-parsing state.
const POLL_INTERVAL_MS = 1500

async function pollOnce(scanId: string): Promise<ScanPollResult | null> {
  // TODO(BUILD 3): panggil GET /api/scan/:id (Supabase edge function) & parse ke ScanPollResult.
  // Untuk sekarang: tidak ada server → tidak ada update tambahan.
  void scanId
  return null
}

export interface UseScanPollResult {
  poll: ScanPollResult | null
  done: boolean
}

function isTerminal(state: ScanState): boolean {
  return state === 'completed' || state === 'cache_completed' || state === 'failed' || state === 'limited'
}

/**
 * Polling state machine scan. Menerima `initial` yang bisa berubah (mis. user menekan SCAN) dan
 * menyinkronkan status terkini. `pollOnce` membaca server bila tersedia; sekarang kembali null
 * (server belum aktif) sehingga state bertahan hingga terminal/fallback.
 */
export function useScanPoll(initial: ScanPollResult | null): UseScanPollResult {
  const [poll, setPoll] = useState<ScanPollResult | null>(initial)

  // Sinkronkan ketika initial berubah (id baru dari user menekan SCAN).
  useEffect(() => {
    if (initial && initial.id !== poll?.id) setPoll(initial)
  }, [initial, poll])

  const done = poll ? isTerminal(poll.state) : false
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!poll || done) return
    timer.current = setInterval(async () => {
      const next = await pollOnce(poll.id)
      if (next) setPoll(next)
    }, POLL_INTERVAL_MS)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [poll, done])

  return { poll, done }
}
