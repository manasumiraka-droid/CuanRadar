# CuanRadar — Log Fase 1 · BUILD 1–5 (Pilot + Production)

> **Status correction (2026-09-07):** Dokumen ini adalah histori implementasi awal. Klaim BUILD 5 selesai/production-ready di bawah tidak lagi menjadi status terkini setelah audit Public Beta. Gunakan `docs/HANDOFF_PUBLIC_BETA.md`, `docs/PUBLIC_BETA_PLAN.md`, dan `docs/ROADMAP.md` v1.3 sebagai sumber status terbaru.

*Status historis per 2026-08-31: implementasi awal BUILD 1–5 selesai. Status terkini: BUILD 5.1 menunggu staging, lalu BUILD 5.2–5.3 sebelum Public Beta · Referensi terbaru: `docs/ROADMAP.md` v1.3.*

## Cakupan BUILD 1 (PRD §64)

UI · authentication · database · navigation · profile · rewards foundation · saved apps · scan UI · credits · empty states · security · provider abstractions.

## Status Tugas

| # | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | Skeleton Vite+React+TS+TanStack+Tailwind | ✅ Selesai | F0; build hijau |
| 2 | Types inti & config plan | ✅ Selesai | `src/types.ts` (tiga sumbu status, currency sen IDR), `src/config/plans.ts` (kuota Free/Pro/Pro+) |
| 3 | Supabase client + Auth context | ✅ Selesai | `src/lib/supabase.ts` (graceful tanpa env), `src/lib/auth.tsx` (email OTP + Google) |
| 4 | Provider abstractions | ✅ Selesai | `src/providers/types.ts` + stub (`AIProvider`, `SearchProvider`) — implementasi nyata BUILD 2 |
| 5 | Navigasi mobile-first | ✅ Selesai | `src/components/Layout.tsx` — bottom nav 6 item (mobile) + top nav (md+) |
| 6 | Halaman | ✅ Selesai | Dashboard, Scan, Rewards, Compare, Saved, Profil, Login |
| 7 | Saved apps (lokal) | ✅ Selesai | localStorage sementara; sinkron akun di Fase 2 |
| 8 | Scan UI + credits + empty states | ✅ Selesai | Kuota harian tampil; hasil Quick Scan memakai data kurasi F0 (provenance jujur) |
| 9 | Schema Supabase + RLS | ✅ Selesai | `supabase/migrations/0001_init.sql` — 12 tabel, enum, RLS (katalog publik, data user owner-only, review queue deny-by-default) |
| 10 | Seed script | ✅ Selesai | `scripts/seed-supabase.mjs` (`npm run db:seed`) |
| 11 | Typecheck + build | ✅ Selesai | **Hijau** — typecheck bersih; build vite 8.2.2 (211 modul); initial JS gzip **145,96 kB** (< budget 150 kB) via code-split per halaman |
| 12 | Landing page + responsive penuh | ✅ Selesai | `/` = landing (hero, fitur, contoh hasil scan, cara kerja, harga, FAQ, footer); `/app/*` = aplikasi. Desktop (md+): sidebar kiri; mobile: bottom nav. Build ulang hijau (145,01 kB gzip) |

## Catatan BUILD 1

1. **Tanpa Supabase, aplikasi tetap jalan** — data katalog dari `data/seed-platforms.json` (kurasi F0), saved apps via localStorage; halaman Login/Profil menampilkan SetupNotice bila env kosong.
2. **Tidak ada hasil palsu** — Quick Scan menampilkan data seed dengan label "sumber: katalog kurasi F0"; Deep Scan menampilkan pesan "engine hadir di BUILD 2" (PRD §54: jangan mengisi hasil artificial).
3. **Score/rank belum dihitung** (`score: null`) — masuk BUILD 3 (deterministik 6 faktor).
4. **Keamanan**: service-role key hanya untuk script/edge function; RLS aktif sejak migrasi pertama (AI_RULES §6, §16).

## BUILD 2 — Status (SELESAI, 2026-08-30)

| # | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | Seed 30 platform ke Supabase | ✅ Selesai | `npm run db:seed` — 30 berhasil, 0 gagal |
| 2 | UI → Supabase (`reward_apps`) | ✅ Selesai | `src/lib/platforms.ts` (usePlatforms, fallback seed jujur); semua halaman memakai DB + label sumber |
| 3 | Provider nyata | ✅ Selesai | `engine/providers.mjs`: Brave/Serper (search) + DeepSeek (AI, routing cheap/mid/premium); stub bila kunci kosong |
| 4 | Engine discovery/extraction | ✅ Selesai | `engine/scan.mjs` (DB-first, limit PRD §13/§18, dedup), `engine/extraction.mjs` (JSON schema + sanitasi + retry terbatas), `engine/sufficiency.mjs` (PRD §14) |
| 5 | CLI scan | ✅ Selesai | `npm run scan:quick` / `scan:deep` (+ `--save` → review_queue_items) |
| 6 | Verifikasi end-to-end | ✅ Selesai | Quick Scan DB-first: data 30 platform, sufficiency 6/4 → `cache_completed`, 0 search/AI; build hijau (145,23 kB gzip) |

**Catatan:** Deep Scan discovery butuh `DEEPSEEK_API_KEY` + `SEARCH_PROVIDER`/`SEARCH_API_KEY` (free-tier Brave/Serper) — belum diisi user; engine menolak dengan pesan jelas (tidak mengarang, PRD §13/§18).

## BUILD 3 — Status (SELESAI, 2026-08-30)

**Kolaborasi:** Sesi Frontend (`docs/SESSIONS_FRONTEND.md` sesi 1–2) + backend sesi ini.

| # | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | **Frontend sesi 1**: Reward Detail, CuanScore 6 faktor (klien), provenance, WhyRecommended, link prioritas | ✅ Selesai | `src/lib/scoring.ts`, `ScoreBadge`, `ProvenanceBadge`, `RewardDetailPage` (`/app/rewards/:slug`), `RewardCard` diperluas |
| 2 | **Frontend sesi 2**: Scan UX state machine + polling, kuota real `scan_credits`, cache/TTL + forced refresh, banner Budget Governor, estimasi & kalkulator asumsi | ✅ Selesai | `src/lib/scan.ts` (runQuickScanLocal + useScanPoll), `scanCredits.ts`, `CacheStatus`, `GovernorBanner`, `EstimationCalculator`, `ScanProgress` |
| 3 | **Backend: engine scoring** | ✅ Selesai | `engine/scoring.mjs` — 6 faktor deterministik (server = sumber kebenaran; skala Reward/Effort: Rp20.000/jam = 1.0), stability dari reward_history, netral 0.5 |
| 4 | **Backend: engine verify** | ✅ Selesai | `engine/verify.mjs` — rubrik 8 pemeriksaan → risk_level; fail kritis → terindikasi_scam |
| 5 | **Backend: engine cache** | ✅ Selesai | `engine/cache.mjs` — key `country:category:type:hash`, TTL (72/24/6-24 jam, expired immediate); **fix: nama file aman Windows (':' ilegal → '_')** |
| 6 | **Backend: engine budget** | ✅ Selesai | `engine/budget.mjs` — Governor 70/85/95/100%, split LLM/Search, estimasi biaya (PRD §40–43) |
| 7 | **Backend: engine calc** | ✅ Selesai | `engine/calc.mjs` — estimasi harian/mingguan/bulanan/per-jam; data kurang → `{ok:false}` (PRD §30) |
| 8 | **Integrasi scan.mjs + CLI** | ✅ Selesai | cache-first → DB → discovery; budget gate deep scan; dedup vs katalog (hindari dupe Melolo/ReelRich); skor per kandidat; cost tracking; `--history` catat `scan_history` (dibaca UI) |
| 9 | **Verifikasi** | ✅ Selesai | Unit test engine (scoring/verify/calc/cache/budget) hijau; Quick Scan CLI: `Sumber: cache` + Governor NORMAL + scan_history tercatat; typecheck + build hijau (initial gzip 138,44 kB) |

**Catatan:** edge function `scan` SUDAH diimplementasikan DAN **TELAH DI-DEPLOY** (2026-08-31, project `xtwowaolrroqdxpbwsvg`): quick = DB-first server-side (filter kategori terverifikasi), deep = discovery+extraction+review queue (terverifikasi: 3 kandidat wallet masuk review queue). Kuota dikonsumsi server-side saat scan berjalan. `public/_redirects` SPA fallback aktif — **`cuanradar.pages.dev` live dengan build terbaru (wrangler direct upload), semua deep-link 200**.

## BUILD 4 — Status (SELESAI, 2026-08-31)

| # | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | Review queue UI | ✅ Selesai | `src/lib/reviewQueue.ts` + aksi `listCandidates` di edge function (baca review_queue via service role, tanpa migrasi RLS); section "Kandidat baru — menunggu tinjauan" di Rewards + indikator amber di Dashboard |
| 2 | Prompt ekstraksi diperkuat | ✅ Selesai | engine + edge function: fokus aplikasi tersedia Indonesia; reward_types/payout hanya bila disebut (array kosong bila tidak) — mengurangi field kosong & mengarang |
| 3 | Touch target ≥44px | ✅ Selesai | RewardCard (Simpan/Detail/Buka) & ScanControls (Quick/Deep) → `min-h-11` |
| 4 | Reliability edge case | ✅ Selesai | listCandidates error → `[]` (tidak crash); terverifikasi: 5 kandidat terbaru terpanggil |
| 5 | Deploy & verifikasi | ✅ Selesai | edge function redeployed; pages deploy via wrangler; commit `b4640de` |

## BUILD 5 — Status (SELESAI, 2026-08-31)

| # | Tugas | Status | Catatan |
|---|---|---|---|
| 1 | Operational controls (edge function) | ✅ Selesai | **Deep Scan wajib login** (401) — tamu hanya Quick Scan DB-first; **throttle tamu** (max 20 quick/10 menit → 429); **dedup kandidat vs katalog + review queue** (hindari duplikat berulang) |
| 2 | Sanitasi error server | ✅ Selesai | Catch → pesan generik + `console.error` (detail internal tidak bocor ke client — AI_RULES §18) |
| 3 | Analytics (PostHog opsional) | ✅ Selesai | `src/lib/analytics.ts` — posthog-js **dynamic import** (code-split, no-op tanpa key); event: `landing_view`, `page_view`, `scan_started/completed/failed`, `scan_blocked_login` |
| 4 | UX gating Deep Scan | ✅ Selesai | ScanPage: deep tanpa login → pesan "Masuk terlebih dahulu" (tanpa panggil server) |
| 5 | Security audit | ✅ Selesai | Bundle **bersih dari secret** (grep `sbp_`/JWT/service-role di dist) ✓; RLS tetap; env handling aman |
| 6 | Performa | ✅ Selesai | posthog di-split (tidak di bundle awal); index 84,67 kB gzip + supabase chunk 54,07 kB (ter-cache); tanpa warning chunk |
| 7 | Deploy & verifikasi | ✅ Selesai | edge function redeployed (401/429 terverifikasi); pages deploy via wrangler; commit `af2f492` |

## TODO setelah BUILD 5 (Fase 2 — Growth)

- [ ] **Opsional user:** key PostHog di env Pages (`VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`) → analytics aktif.
- [ ] **Opsional user:** domain custom `cuanradar.id` + DNS Cloudflare (DEPLOYMENT §3.4).
- [ ] Seed `reward_offers` via kurasi (estimated_menit, reward_value) → `EstimationCalculator` beralih `basedOn:'data'`.
- [ ] Alur tinjauan editor untuk review_queue (approve → reward_apps, reject → discard).
- [ ] F2: affiliate/iklan, komunitas (payout_reports), ekspansi 50+ platform, 10k MAU.
