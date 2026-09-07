# CuanRadar — Arsitektur Teknis

*Revisi: v1.3 · 2026-09-07 · Living document · Prinsip: low cost, database-first, mobile-first*

## 1. Keputusan Stack (final untuk pilot)

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | **Vite + React + TypeScript + TanStack (Router/Query) + Tailwind CSS** | SPA di Cloudflare Pages; **Next.js/Vercel TIDAK dipakai** (lihat §1A); SEO ditangani tanpa framework penuh |
| UI | shadcn/ui (Radix) bila dibutuhkan komponen kompleks | Mobile-first breakpoint 375px → 640 → 1024 → 1280; touch target ≥44px; dark mode |
| Backend | **Supabase** (PostgreSQL + Auth + Edge Functions) | Free tier cukup untuk pilot |
| Scan execution | **Background queue** (pg-boss di Supabase / Cloudflare Queues) | Edge function hanya menerima & meng-enqueue — scan panjang TIDAK sinkron (PRD Appendix A3) |
| AI | **DeepSeek** via `AIProvider` abstraction | Beta: `deepseek-v4-flash` non-thinking untuk ekstraksi JSON; reward math/scoring tetap kode |
| Search | `SearchProvider` abstraction | Beta: Tavily `basic` utama; Serper fallback terbatas/manual second check |
| Hosting/CDN/WAF/DDoS/DNS | Cloudflare | Rate limiting di Cloudflare + application layer |
| Source control | GitHub | CI untuk test & deploy |
| Monitoring | Cloudflare + Supabase + log scan (`scan_history`) | Cost tracking per scan (PRD §43) |

### 1A. Keputusan Stack & Alternatif yang Ditolak *(keputusan founder)*

**Keputusan:** Next.js dan Vercel TIDAK dipakai di pilot.

**Alasan:**
1. **Next.js terlalu sering update mayor** (13→14→15 dalam ±2 tahun) dengan breaking changes — beban maintenance tidak sebanding untuk produk data-driven sederhana seperti ini.
2. **Vercel terbatas untuk aplikasi komersial** — free tier untuk non-komersial/hobi; kebutuhan komersial mendorong ke paket berbayar per-seat dan fitur proprietary (middleware/ISR/incremental caching) yang menciptakan lock-in.
3. **Produk ini SPA interaktif** (dashboard, scan, tracker) — SSR tidak diperlukan untuk core loop; halaman publik dapat di-pre-render tanpa framework penuh.

**Alternatif yang dievaluasi & ditolak:**

| Alternatif | Alasan tolak |
|---|---|
| Next.js + Vercel | Alasan di atas (churn update + keterbatasan komersial + lock-in) |
| Astro (full app) | Bagus untuk SEO/konten, tapi produk ini app-heavy; React SPA lebih sederhana untuk core loop. Opsi: Astro hanya untuk halaman publik/SEO di F2 bila data menunjukkan perlu |
| SvelteKit | Ekosistem React lebih sesuai (PRD & kandidat developer); tidak ada keunggulan menentukan |
| tRPC / T3 stack | Overhead coupling; Supabase client + TanStack Query sudah cukup |
| VPS self-host (Node/Hono + Postgres) | Infra lebih murah tapi ops lebih berat; simpan sebagai escape hatch F3 bila batas serverless menghambat (desain modular PRD §60 memungkinkan tanpa rewrite) |

**Strategi SEO (tanpa Next.js):** pilot tidak membutuhkan SEO untuk validasi. Bila halaman katalog publik jadi prioritas di F2, opsi berurutan: (a) prerender statis saat build (`vite-plugin-ssg`/react prerender) → (b) Astro untuk halaman publik + React islands → (c) Cloudflare Worker + HTMLRewriter untuk meta tags. Keputusan di F2 berdasarkan data.

## 2. Diagram Alur Scan

```
Klien → POST /api/scan (validasi credit & rate limit) → enqueue job
                                                     ↓
                              Worker (queue): CHECK_CACHE → DISCOVER → FILTER → EXTRACT → VERIFY
                                                     ↓
                              CALCULATE (kode deterministik) → SCORE (kode) → RANK → simpan hasil
                                                     ↓
Klien ← GET /api/scan/:id (polling state machine) ← COMPLETED / FAILED / LIMITED
```

- Discovery Lock (PRD §16, v1.1): Quick 60 dtk, Deep 10 menit, dengan lease.
- Concurrency: max 5 Deep Scans; sisanya QUEUED atau pakai cache (PRD §45).
- Budget Governor (PRD §41): 0–70% NORMAL · 70–85% MORE CACHING · 85–95% LIMIT DEEP SCAN · 95–100% EMERGENCY · 100% NO NEW DEEP SCAN.
- **Eksekusi bertahap (staged jobs):** satu scan = beberapa job queue kecil per tahap (discovery → extraction → verification → scoring), bukan satu fungsi panjang — aman terhadap batas waktu eksekusi serverless (mempertegas PRD Appendix A3).
- **Scheduled jobs:** pg_cron di Supabase untuk penandaan EXPIRED harian & penjadwalan re-verifikasi; worker queue memproses batch. (Verifikasi ketersediaan pg_cron pada plan saat F0.)

## 3. Model Data (entitas inti)

```
users / profiles            — preferensi, credits
reward_apps                 — name, developer/company_identity, category, website, store_url, icon,
                               country, status allowlist, risk_level, last_verified_at
reward_offers               — reward_type, reward_value, reward_unit, currency, nilai rupiah integer
                               minor unit (sen IDR), activity, conditions, min_activity, max_reward,
                               min_withdrawal, validity, offer_status (active/expired/scheduled),
                               estimated_menit, referral_url (berlabel), source, provenance
reward_sources              — hierarki ★★★★★→★ + URL + snapshot tanggal
verification_records        — field yang diverifikasi, metode, bukti_ref, reviewer, verified_at
reward_history              — deret nilai reward per periode (dasar Reward Stability)
payout_reports              — BARU v1.1: bukti reward cair (platform, jumlah, tanggal, metode, bukti, status)
community_reports           — BARU v1.1: telat bayar / ubah syarat / indikasi scam + status moderasi
review_queue_items          — BARU v1.1: kandidat hasil extraction menunggu tinjauan
scan_history                — input, state, cost breakdown, cache hit, kandidat
scan_credits                — saldo & pemakaian per user
user_saved_apps             — favorit
```

Relasi kunci: `reward_apps 1—N reward_offers`; `reward_offers 1—N reward_history`; `reward_apps 1—N payout_reports`; `reward_offers 1—N verification_records`.

## 4. API Surface (PRD §61 + penyesuaian v1.1)

```
POST   /api/scan                    → enqueue; body {type, category}; resp scan_id
GET    /api/scan/:id                → state machine + hasil (termasuk provenance, risk_level)
GET    /api/rewards?category=&filter=
GET    /api/rewards/:id
GET    /api/apps / GET /api/apps/:id
GET    /api/compare?ids=a,b,c,d     → BARU v1.1 (fitur Compare)
GET    /api/user/preferences · PATCH /api/user/preferences
GET    /api/saved-apps · POST /api/saved-apps · DELETE /api/saved-apps/:id
GET    /api/scan-credits
POST   /api/reports                 → BARU v1.1: payout_report / community_report (moderasi)
```

## 5. Cache (PRD §36–37)

Key: `country-category-scan_type-filter_hash` (mis. `ID:shopping:quick:all`).
TTL: normal 72 jam · popular 24 jam · flash 6–24 jam · expired immediate · forced refresh bypass.
Ditambah (v1.1): **scheduled daily job** menandai EXPIRED & memicu re-verifikasi.

## 6. Keamanan

- **Web content = UNTRUSTED INPUT** (PRD §46): AI hanya mengekstrak data; tidak mengikuti instruksi dari halaman web (anti prompt-injection); output divalidasi skema JSON; truncate content; retry terbatas.
- **URL security** (PRD §47): prioritas official website → Google Play → App Store → marketplace resmi; larang APK mirror, unknown downloads, redirect mencurigakan, short URL tak terverifikasi.
- **Third-party account safety** (PRD §48): tidak pernah meminta password/OTP/PIN, login otomatis wallet, baca saldo, transaksi, withdrawal, atau earning task otomatis.
- Auth: Supabase Auth (email + Google). Data pribadi diminimalkan (UU PDP).
- Lainnya: CSP, rate limiting (Cloudflare + app: 1 active scan, 5 scan/10 menit/user — PRD §44), sanitasi UGC, CSRF, dependency audit (Renovate/Dependabot).

## 7. Cost & Monitoring

- Target desain Public Beta: total provider <US$10–20/bulan melalui shared cache dan discovery terjadwal; bukan jaminan biaya.
- Setiap scan mencatat: search requests, AI requests, token usage, model, estimated cost (LLM & Search terpisah), cache hit, candidates, verification (PRD §43).
- Target per Deep Scan (PRD §42 v1.1): total excellent < US$0.005; red flag > US$0.03.
- Harga/model/terms vendor harus diverifikasi sebelum rollout; semua rate biaya configurable melalui secret/env dan tunduk pada hard cap fail-closed.

## 8. Performa (mobile-first)

- LCP < 2,5 dtk di 4G · Lighthouse ≥90 (Performance, Accessibility, Best Practices) · JS awal < 150 KB gzip.
- Halaman katalog/listing dapat di-pre-render/di-cache; halaman hasil scan di-render dari data cached.
- PWA (manifest + service worker): installable, offline shell (Fase 3 untuk push notification).

## 9. Struktur Modul Backend (PRD §60 — satu backend modular, bukan microservices)

```
/backend
  scan/        controller · governor · cache · orchestrator
  discovery/   search · candidate-filter · deduplication
  extraction/  reward-extractor
  verification/verifier · source-trust
  calculation/ reward-calculator · earning-estimator
  scoring/     recommendation-score
  monitoring/  cost · usage
  queue/       jobs: scan-runner · daily-reverify · expiry-marker
```

## 10. Non-Goals Teknis Pilot

Microservices · multi-region · native app · social · personalization lanjutan · subscription kompleks · autonomous unlimited browsing.
