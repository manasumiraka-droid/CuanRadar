// CuanRadar — Dashboard (PRD §51): greeting, kuota, tombol scan, rekomendasi, saved, recent scan
import { Link } from '@tanstack/react-router'
import { usePlatforms, useRefetchPlatforms } from '../lib/platforms'
import { useScanCredits, useGovernor } from '../lib/scanCredits'
import { getSavedIds, toggleSaved } from '../lib/savedApps'
import { RewardCard } from '../components/RewardCard'
import { EmptyState } from '../components/EmptyState'
import { GovernorBanner } from '../components/GovernorBanner'
import { CacheStatus } from '../components/CacheStatus'
import { useState } from 'react'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 11) return 'Selamat pagi'
  if (h < 15) return 'Selamat siang'
  if (h < 19) return 'Selamat sore'
  return 'Selamat malam'
}

export function DashboardPage() {
  const { platforms, source, dataUpdatedAt } = usePlatforms()
  const refetch = useRefetchPlatforms()
  const { credits } = useScanCredits()
  const governor = useGovernor(credits)
  const saved = getSavedIds()
  const [, setSavedVersion] = useState(0)

  const recommended = platforms.filter((p) => p.status === 'mvp').slice(0, 5)

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-xl font-bold">{greeting()} 👋</h1>
        <p className="text-sm text-slate-400">
          Cari peluang reward terbaik hari ini — setiap menit Anda berharga.
        </p>
      </section>

      <GovernorBanner governor={governor} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Scan Credits (Plan {credits.plan})</p>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Kuota harian</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-800/60 p-3">
            <p className="text-xs text-slate-400">Quick Scan</p>
            <p className="text-lg font-bold">{credits.quickRemaining}× tersisa</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-3">
            <p className="text-xs text-slate-400">Deep Scan</p>
            <p className="text-lg font-bold">{credits.deepRemaining}× tersisa</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            to="/app/scan"
            className="rounded-xl bg-emerald-500 px-3 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            ⚡ Quick Scan
          </Link>
          <Link
            to="/app/scan"
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-center text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            🔍 Deep Scan
          </Link>
        </div>
      </section>

      <CacheStatus dataUpdatedAt={dataUpdatedAt} source={source} onRefresh={refetch} />

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Rekomendasi terbaik</h2>
          <Link to="/app/rewards" className="text-xs text-emerald-300 hover:text-emerald-200">
            Lihat semua →
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {recommended.map((p) => (
            <RewardCard
              key={p.id}
              platform={p}
              saved={saved.includes(p.id)}
              onToggleSave={() => {
                toggleSaved(p.id)
                setSavedVersion((v) => v + 1)
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Tersimpan ({saved.length})</h2>
        {saved.length === 0 ? (
          <EmptyState title="Belum ada aplikasi tersimpan" description="Ketuk 'Simpan' pada kartu reward untuk memantau peluang favorit Anda." />
        ) : (
          <p className="text-xs text-slate-400">{saved.length} aplikasi tersimpan — lihat di halaman Saved.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Scan terakhir</h2>
        <EmptyState title="Belum ada scan" description="Jalankan Quick Scan pertama Anda untuk melihat peluang terbaik hari ini." />
      </section>
    </div>
  )
}
