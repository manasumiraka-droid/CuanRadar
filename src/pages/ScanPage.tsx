// CuanRadar — AI Scan (PRD §52–54, §63; Appendix A9)
// BUILD 3: Scan dijalankan lewat edge function Supabase (server-side).
//   - Quick Scan: DB-first (PRD §11/§14) — cache_completed/limited, TANPA AI bila data cukup.
//   - Deep Scan: discovery (search) → ekstraksi AI → review queue → completed.
// Kuota dikonsumsi SERVER-SIDE hanya saat scan benar-benar berjalan (PRD §39 v1.2);
// klien tidak pernah menurunkan kuota pada klik.
// Fallback: bila Supabase belum dikonfigurasi, Quick Scan memakai hasil lokal (jujur, tidak mengarang).
import { useState } from 'react'
import { usePlatforms, useRefetchPlatforms } from '../lib/platforms'
import { startScanRemote, runQuickScanLocal } from '../lib/scan'
import { isSupabaseConfigured } from '../lib/supabase'
import { ScanControls, type ScanType } from '../components/ScanControls'
import { RewardCard } from '../components/RewardCard'
import { getSavedIds, toggleSaved } from '../lib/savedApps'
import { EmptyState } from '../components/EmptyState'
import { ScanProgress } from '../components/ScanProgress'
import { GovernorBanner } from '../components/GovernorBanner'
import { CacheStatus } from '../components/CacheStatus'
import { useScanCredits, useGovernor } from '../lib/scanCredits'
import { ProvenanceBadge } from '../components/ProvenanceBadge'
import { useAuth } from '../lib/auth'
import { capture } from '../lib/analytics'
import type { Category, ScanPollResult } from '../types'

export function ScanPage() {
  const [scanType, setScanType] = useState<ScanType>('quick')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [poll, setPoll] = useState<ScanPollResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [, setSavedVersion] = useState(0)
  const saved = getSavedIds()
  const { platforms, source, dataUpdatedAt } = usePlatforms()
  const refetch = useRefetchPlatforms()
  const { credits, refresh } = useScanCredits()
  const governor = useGovernor(credits)
  const { user } = useAuth()

  const results = poll?.results ?? []
  const done = poll ? ['completed', 'cache_completed', 'failed', 'limited'].includes(poll.state) : false
  const isDeepRunning = scanType === 'deep' && scanning

  async function handleScan() {
    // Deep Scan mahal → wajib login (operational control, BUILD 5); tamu hanya Quick Scan DB-first.
    if (scanType === 'deep' && !user) {
      capture('scan_blocked_login')
      setPoll({
        id: `login-${Date.now()}`,
        state: 'limited',
        source: 'database',
        results: [],
        candidates: 0,
        error: 'Masuk terlebih dahulu untuk Deep Scan — kuota per user. Quick Scan tetap gratis tanpa login.',
      })
      return
    }
    setScanning(true)
    capture('scan_started', { type: scanType, category })
    setPoll(
      scanType === 'deep'
        ? { id: `deep-${Date.now()}`, state: 'discovering', source: 'database', results: [], candidates: 0 }
        : { id: `quick-${Date.now()}`, state: 'checking_cache', source: 'database', results: [], candidates: 0 },
    )
    try {
      const result = isSupabaseConfigured()
        ? await startScanRemote({ type: scanType, category })
        : scanType === 'quick'
          ? runQuickScanLocal(platforms, category)
          : (() => {
              throw new Error('Deep Scan membutuhkan edge function server (deploy: lihat docs/DEPLOYMENT.md)')
            })()
      setPoll(result)
      capture('scan_completed', { type: scanType, state: result.state, candidates: result.candidates })
      refresh() // kuota server terbaru setelah scan benar-benar berjalan
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scan gagal'
      capture('scan_failed', { type: scanType, error: msg })
      setPoll({
        id: `err-${Date.now()}`,
        state: 'failed',
        source: 'database',
        results: [],
        candidates: 0,
        error: msg,
      })
    } finally {
      setScanning(false)
    }
  }

  const available = category === 'all' ? platforms.length : platforms.filter((p) => p.category === category).length
  const minNeededN = category === 'all' ? 12 : ({ entertainment: 4, shopping: 4, wallet: 2, lainnya: 2 } as Record<Category, number>)[category]

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-bold">AI Scan</h1>
        <p className="text-sm text-slate-400">
          Sisa kuota hari ini: ⚡ {credits.quickRemaining} quick · 🔍 {credits.deepRemaining} deep
          {credits.source === 'config' ? ' (kuota statis — masuk untuk kuota server)' : ''}
        </p>
      </section>

      <GovernorBanner governor={governor} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <ScanControls scanType={scanType} onScanTypeChange={setScanType} category={category} onCategoryChange={setCategory} />
        <button
          type="button"
          onClick={() => void handleScan()}
          disabled={scanning}
          className="mt-4 w-full rounded-xl bg-emerald-500 px-3 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {scanning ? 'Memindai…' : scanType === 'quick' ? '⚡ SCAN' : '🔍 SCAN'}
        </button>
        <p className="mt-2 text-[11px] text-slate-500">
          Kecukupan data ({category === 'all' ? 'semua kategori' : category}): {available}/{minNeededN} platform ·{' '}
          {available >= minNeededN ? 'cukup — hasil dari database' : 'kurang — discovery otomatis via engine'}
        </p>
      </section>

      <CacheStatus dataUpdatedAt={dataUpdatedAt} source={source} onRefresh={refetch} />

      {!poll ? (
        <EmptyState
          title="Mulai scan pertama Anda"
          description="Kami memeriksa peluang reward terkini. Scan pertama mungkin sedikit lebih lama."
        />
      ) : isDeepRunning ? (
        <>
          <ScanProgress state="discovering" candidates={0} />
          <EmptyState title="Deep Scan berjalan server-side" description="Mencari peluang baru via search & AI — hasil masuk review queue sebelum dipublikasikan." />
        </>
      ) : done ? (
        poll.state === 'failed' ? (
          <EmptyState title="Scan gagal" description={poll.error ?? 'Terjadi kesalahan. Coba lagi nanti.'} />
        ) : poll.source === 'search' ? (
          <>
            <ScanProgress state="completed" candidates={poll.candidates} />
            <EmptyState
              title={`${poll.candidates} kandidat masuk tinjauan`}
              description="Detail kandidat tidak ditampilkan sebelum diverifikasi editor. Katalog publik tetap berisi data yang sudah dikurasi."
            />
          </>
        ) : results.length === 0 ? (
          <>
            {poll.state === 'limited' ? <ScanProgress state="limited" candidates={0} /> : null}
            <EmptyState title="Belum ada peluang reward pada kategori ini" description="Coba kategori lain atau jalankan scan lagi nanti." />
          </>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {results.length} peluang ditemukan
              </h2>
              <ProvenanceBadge provenance={poll.source === 'cache' ? 'cache' : 'database'} />
            </div>
            {results.map((p) => (
              <RewardCard
                key={p.id}
                platform={p}
                saved={saved.includes(p.id)}
                onToggleSave={() => {
                  toggleSaved(p.id)
                  setSavedVersion((v) => v + 1)
                }}
                provenance={poll.source === 'cache' ? 'cache' : 'database'}
              />
            ))}
          </section>
        )
      ) : (
        <ScanProgress state={poll.state} candidates={poll.candidates} />
      )}

      <p className="text-[11px] text-slate-600">
        Provenance selalu ditampilkan; kandidat baru tetap privat sampai lolos tinjauan editor (PRD Appendix A6/A9).
      </p>
    </div>
  )
}
