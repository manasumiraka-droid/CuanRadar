# CuanRadar — Strategi Deployment

*Revisi: v1.2 · 2026-09-07 · Living document · Referensi: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PUBLIC_BETA_PLAN.md`*

## 1. Kapan Deployment Dilakukan (per fase)

| Fase | Deployment | Tujuan |
|---|---|---|
| **F0** | — | Repo + CI (typecheck/build) saja; belum ada URL publik |
| **F1 (BUILD 1–3)** | **Preview otomatis** (Cloudflare Pages per commit/PR) | Developer & tester melihat hasil tiap perubahan |
| **F1 (BUILD 4–5 — legacy live)** | Versi awal pernah live di `cuanradar.pages.dev` | Bukan bukti Public Beta Ready |
| **F1B (BUILD 5.1–5.3)** | Branch preview + Supabase staging terpisah; kemudian controlled production rollout | Public Beta Ready setelah seluruh gate lulus |
| **F2 (BUILD 6–7)** | Domain custom, community, membership/payment setelah keputusan beta | Growth dan commercial readiness |
| **F3** | Scale: PWA push, payment gateway (Midtrans/Xendit), B2B | Pertumbuhan & pendapatan |

**Kesimpulan:** versi awal pernah di-deploy pada 2026-08-31, tetapi perubahan BUILD 5.1 belum production. Hardening, staging, monitoring, backup/restore, dan rollback adalah prasyarat sebelum label Public Beta Ready.

## 2. Di Mana Deployment (target sesuai keputusan stack — tanpa Next.js/Vercel)

| Layer | Target | Catatan |
|---|---|---|
| Frontend (SPA) | **Cloudflare Pages** | Free tier; global CDN (POP Indonesia); preview URL per PR |
| CDN/WAF/DDoS/DNS | **Cloudflare** | Sudah bagian dari Pages; custom domain di F2 |
| Backend/DB/Auth | **Supabase** (hosted Postgres) | **Pilih region Singapore saat buat project** (terdekat ke Indonesia; tidak bisa diubah setelah dibuat) |
| Edge Functions / API entry | Supabase Edge Functions | Hanya menerima & meng-enqueue scan (bukan eksekusi panjang) |
| Scan queue & scheduled jobs | pg-boss + pg_cron di Supabase Postgres | Tanpa platform tambahan |
| Source control & CI | **GitHub** + GitHub Actions | Sudah ada (typecheck+build); deploy dihubungkan ke Pages |
| AI & Search | deepseek + search free-tier (eksternal) | Via env/secrets, bukan "deployment" internal |
| Monitoring & Analytics | PostHog + Sentry atau alternatif yang disetujui | Wajib aktif sebelum Public Beta; minimalkan data pribadi |

## 3. Bagaimana Deployment Dilakukan

### 3.1 Alur utama (rekomendasi — paling sederhana & gratis)

```
Developer push ke GitHub
   ↓
GitHub Actions CI: npm ci → typecheck → build (gerbang kualitas, sudah ada)
   ↓
Cloudflare Pages Git integration (connect repo GitHub)
   ├─ branch main  → production (cuanradar.pages.dev / domain custom di F2)
   └─ pull request → preview URL otomatis (unlimited, gratis)
```

- **Frontend:** pakai **Git integration bawaan Cloudflare Pages** (build command `npm run build`, output `dist`) — tanpa API token, tanpa workflow tambahan; preview per-PR otomatis.
- **Database:** migrasi via `supabase/migrations/0001_init.sql` — SQL Editor dashboard ATAU `supabase db push` (supabase CLI) saat sudah dipasang.
- **Seed:** `npm run db:seed` (sekali, setelah migrasi).
- **Edge Functions (BUILD 2–3):** `supabase functions deploy` dari repo.

### 3.2 Environment variables & secrets (AI_RULES §9)

| Variabel | Di mana | Keterangan |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | **Cloudflare Pages → Settings → Environment variables** (production & preview) | Client-safe; **tidak di-commit** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secrets (edge functions) + `.env` lokal untuk script seed | **Server-side only; JANGAN pernah di frontend** |
| `ALLOWED_ORIGINS`, `RATE_LIMIT_SALT` | Supabase Secrets | Origin frontend eksplisit dan salt acak untuk rate limit tamu |
| `SEARCH_PROVIDER`, `SEARCH_API_KEY`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL` | Supabase Secrets | Credentials dan pilihan provider Deep Scan |
| `DAILY_PROVIDER_BUDGET_USD` + variabel harga provider | Supabase Secrets | Hard cap budget dan estimasi biaya; sesuaikan dengan harga vendor terkini |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets — **hanya bila** memilih deploy via wrangler-action (alternatif Git integration) | Tidak wajib untuk jalur rekomendasi |
| `VITE_POSTHOG_KEY` (dll.) | Cloudflare Pages env | F1 BUILD 5 (opsional) / aktif di F2 |

### 3.3 Environments

- **Sebelum Public Beta:** Supabase staging dan production wajib terpisah; gunakan key, seed, dan dataset berbeda. Cloudflare Preview terhubung ke staging dan branch `main` ke production.
- **Cloudflare Pages:** production (main) + preview (PR) otomatis — gratis.
- **Rollback:** Cloudflare Pages menyimpan riwayat deployment → rollback 1 klik.

### 3.4 Regional & performa

- Supabase region **Singapore** (terdekat Indonesia); frontend dilayani CDN Cloudflare dari POP terdekat (LCP < 2,5 dtk di 4G tetap jadi target — ARCHITECTURE §8).
- Domain: rekomendasi **`.id`** (cuanradar.id) untuk pasar lokal + SEO; alternatif `.com`. Cek ketersediaan = TODO F0 yang belum dieksekusi.

### 3.5 Edge function `scan` (BUILD 3) — deploy & secrets

Frontend memanggil `supabase.functions.invoke('scan', …)` untuk Quick (DB-first server-side) & Deep Scan (discovery + review queue). Kuota dikonsumsi **server-side** saat scan berjalan (bukan klik).

```powershell
# sekali (login + link project)
npx supabase login
npx supabase link --project-ref <PROJECT_REF>   # dari Supabase dashboard → Settings → General

# deploy fungsi
npx supabase functions deploy scan

# set secrets (nilai sama dengan .env lokal Anda; service_role dari dashboard)
npx supabase secrets set DEEPSEEK_API_KEY=<key>
npx supabase secrets set DEEPSEEK_MODEL=deepseek-v4-flash
npx supabase secrets set SEARCH_PROVIDER=tavily
npx supabase secrets set SEARCH_API_KEY=<key>
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<key>
npx supabase secrets set ALLOWED_ORIGINS=https://cuanradar.pages.dev
npx supabase secrets set RATE_LIMIT_SALT=<random-minimal-32-byte>
npx supabase secrets set DAILY_PROVIDER_BUDGET_USD=1
npx supabase secrets set SEARCH_COST_PER_REQUEST_USD=0
npx supabase secrets set AI_MAX_OUTPUT_TOKENS=2500
```

> `SUPABASE_URL` & `SUPABASE_ANON_KEY` otomatis tersedia di runtime edge function. Jangan pernah menyimpan service_role di frontend (AI_RULES §9).

Untuk BUILD 5.1, terapkan migrasi `0002_build_5_1_security_hardening.sql` **sebelum** deploy fungsi dan frontend baru. Checklist rollout lengkap ada di `docs/BUILD_5_1.md`.

## 4. Checklist per Fase

**F1 — IMPLEMENTASI AWAL (legacy, 2026-08-31):**
- [x] Project Cloudflare Pages + GitHub; build `npm run build`, output `dist`; preview per PR.
- [x] Project Supabase (Singapore); migrasi `0001_init.sql`; `npm run db:seed` (30 platform); env Pages terisi.
- [x] UI memakai data Supabase; edge function `scan` deployed (quick DB-first + deep discovery + listCandidates).
- [x] URL publik `cuanradar.pages.dev` live (wrangler direct upload); disclaimers tampil.
- [ ] BUILD 5.1 hardening belum diterapkan ke staging/production.

**F1B — PUBLIC BETA READINESS:**
- [ ] Supabase staging/production dan secrets terpisah.
- [ ] Migration 0002, Edge Function, dan frontend preview lolos smoke/integration test.
- [ ] Budget kill switch, backup/restore, rollback, monitoring, dan audit log teruji.
- [ ] BUILD 5.2 data trust/editor workflow selesai.
- [ ] BUILD 5.3 E2E, legal pages, Lighthouse, dan semua beta gate selesai.

**F2 (BUILD 6–7):**
- [ ] Domain custom `cuanradar.id` + SSL (Cloudflare); monitoring (PostHog) & analytics aktif.
- [ ] Membership/payment hanya setelah hasil Public Beta dan persetujuan keputusan bisnis.
- [ ] Ekspansi katalog 50+ platform; re-verifikasi terjadwal; komunitas payout_reports.

**F3:**
- [ ] Payment gateway (Midtrans/Xendit) server-side; PWA push; B2B.

## 5. Yang Perlu Disiapkan User (saya tidak bisa membuat akun/deploy dari environment ini)

1. Akun **GitHub** (repo sudah siap di lokal).
2. Akun **Cloudflare** → buat Pages project, connect repo.
3. Akun **Supabase** → buat project (region Singapore), salin URL/keys.
4. (Opsional, F2) Domain `cuanradar.id` + akun registrar.

Setelah akun tersedia, alur deploy di atas bisa aktif dalam hitungan menit — seluruh config sudah di repo.
