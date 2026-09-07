# CuanRadar — Estimasi Budget Pilot (F0–F1)

*Revisi: v1.1 · 2026-09-07 · sebagian angka one-off tetap berupa estimasi · Living document*
*Catatan: semua angka adalah estimasi pasar Indonesia/global. Asumsi kurs ±Rp16.500/US$. Angka wajib diverifikasi ulang saat F0/F1 (vendor pricing berubah).*

> Untuk konfigurasi provider dan batas operasional Public Beta terbaru, gunakan `docs/PUBLIC_BETA_PLAN.md`. Estimasi token/model legacy di bawah dipertahankan sebagai histori perencanaan dan tidak boleh dipakai untuk mengisi konfigurasi production tanpa verifikasi vendor.

## 1. Jawaban Singkat (Rekomendasi)

**Skenario paling realistis untuk memulai pilot: LEAN — founder coding sendiri.**

| Skenario | Total cash (F0 + F1, ±3 bulan) | Waktu | Cocok untuk |
|---|---|---|---|
| **A. Founder coding (rekomendasi)** | **Rp10–15 juta** | 300–400 jam sendiri | Validasi ide, MVP cepat, biaya minimal |
| B. Founder + freelancer | Rp50–75 juta | 200–300 jam sendiri + hire 2–3 bulan | Founder non-teknis, mau akselerasi |
| C. Agen/tim kecil | Rp150–300 juta | — | Sudah ada bukti pasar; BUKAN untuk pilot |

Poin kunci: **biaya terbesar pilot bukan infra, tapi waktu** (dan labor kalau di-hire). Infra pilot bisa berjalan di free tier hampir seluruhnya.

## 2. Biaya Satu Kali (One-off, F0)

| Item | Estimasi | Catatan |
|---|---|---|
| Domain (.com / .id) | Rp200–300k / tahun | .id ~Rp150–250k; .com ~Rp200–300k |
| Email domain (Google Workspace / Zoho) | Rp0–100k/bln | Zoho free tier dulu; Workspace ~Rp60–100k/bln/user bila perlu |
| Cek trademark informal + konsultasi DJKI | Rp0–500k | Cek nama "CuanRadar" via pencarian DJKI/online |
| Review UU PDP (template/paralegal) | Rp0–2jt | Self-review template cukup untuk pilot; formal di F2 |
| Desain polish (opsional) | Rp0–5jt | Tailwind + shadcn gratis; polish 1–2 hari bila ada budget |
| Konten/kurasi 20–30 platform (jika outsourcing) | Rp3–8jt | 40–80 jam; bisa dikerjakan founder sendiri (Rp0) |
| **Subtotal F0 (realistis)** | **±Rp1,5–5 juta** | Founder coding: target ≤Rp3 juta |

## 3. Biaya Bulanan Infra (F1, per bulan)

| Komponen | Free-tier | Upgrade (bila terpicu) | Realistis pilot |
|---|---|---|---|
| Supabase (Postgres + Auth + Edge) | Rp0 (Free: 2 project, 500MB) | Pro ~US$25 (~Rp410k) + usage | Rp0 → Rp410k di bulan 2–3 bila beta aktif |
| Cloudflare (Pages/CDN/WAF/DDoS/DNS) | Rp0 | — | Rp0 |
| deepseek (LLM) | pay-as-you-go | — | **US$5–10 (~Rp80–165k)** — budget PRD US$7/bln cukup |
| Search API | Brave/Serper/Tavily free tier (~1–2,5k query/bln) | US$3–5/bln bila lewat | Rp0 (diverifikasi saat implementasi) |
| Monitoring/analytics (Sentry/PostHog) | Rp0 (free tier) | US$10+ bila traffic besar | Rp0 |
| Error/queue (pg-boss di Supabase) | Rp0 | — | Rp0 |
| **Total/bln** | **US$5–10 (~Rp80–165k)** | **US$25–45 (~Rp410–740k)** | **±Rp150–400k/bln** |

**Run rate realistis:** mulai ±Rp150–250k/bln (murni free tier + LLM), naik ke ±Rp400–750k/bln saat Supabase Pro & search berbayar terpicu (tanda: beta aktif & traffic naik).

### 3A. Angka Minimum Realistis untuk AI + Search

**Rekomendasi: US$10/bulan** (LLM US$7 + Search US$3) adalah **minimum yang realistis** — bukan sekadar nyaman. Alasannya hitung-hitungan:

**Per Deep Scan (estimasi legacy):** angka lama tidak lagi menjadi konfigurasi. Public Beta memakai `deepseek-v4-flash`, batch extraction, batas output, cache bersama, dan rate vendor yang diverifikasi saat rollout.

| Level | Budget | Kapasitas | Kapan dipakai |
|---|---|---|---|
| **Floor sementara** | US$3–5/bln (LLM only; search dalam free tier) | ±150–330 Deep Scan/bln (~5–11/hari) | Hanya 2–4 minggu pertama, volume scan rendah |
| **MINIMUM REALISTIS** | **US$10/bln** | Kapasitas diukur dari telemetry staging, bukan asumsi token lama | Pilot beta terbatas dengan cache & discovery lock |
| Nyaman | US$15–20/bln | Headroom Governor (tidak sering masuk EMERGENCY MODE) | Beta mulai aktif harian |
| Pertumbuhan | +US$25 (Supabase Pro) | Dominan oleh DB, bukan AI | Saat free limit Supabase terlewati |

**Mengapa US$10, bukan US$5:** (1) free-tier search punya batas ±1.000–2.500 query/bln ≈ 150–400 Deep Scan — mudah terlampaui; US$3 adalah asuransi/upgrade path. (2) Budget Governor butuh headroom: bila budget nyaris habis, EMERGENCY MODE terlalu sering mematikan Deep Scan dan merusak pengalaman. (3) Premium verification & conflict resolution (PRD §23) tidak boleh nol.

**Catatan:** target PRD §42 (excellent <US$0.005/Deep Scan) tercapai hanya dengan routing hemat + cache hit tinggi — jadikan target internal, bukan janji.

## 4. Rekapitulasi Total Realistis (F0 + F1, 3 bulan)

**Skenario A — Founder coding (rekomendasi):**
- Infra 3 bulan: ±Rp0,5–1,2 juta (free tier + LLM; asumsi Supabase tetap Free)
- One-off F0: ±Rp2–3 juta
- Konten kurasi: Rp0 (dikerjakan sendiri)
- Buffer 15–20%: ±Rp1–2 juta
- **Total: Rp10–15 juta** (nilai tengah ±Rp12 juta) + 300–400 jam waktu sendiri

**Skenario B — Hire freelancer:**
- Fee developer mid-level: Rp15–25jt/bln × 2,5–3 bulan = Rp45–75jt
- + biaya A di atas (infra & one-off): ±Rp5jt
- **Total: Rp50–75 juta** (bulatkan Rp70–80jt termasuk buffer)

**Yang TIDAK perlu dibayar di pilot:** iklan/paid marketing (pakai komunitas & beta 100 user), Supabase Pro (sampai free limit terlewati), trademark resmi DJKI (~Rp1,8jt/kelas — tunda ke F2/F3), legal entity (tunda ke F2), premium model AI.

## 5. Trigger Naik Budget (evaluasi di akhir F1)

| Trigger | Aksi |
|---|---|
| Beta 100 user aktif & retensi positif | Upgrade Supabase Pro; pertimbangkan search berbayar |
| Deep Scan cost > target PRD §42 | Audit prompt/model routing; naikkan budget AI ke US$15–20/bln |
| Validasi pasar kuat (10k+ MAU potensial) | Baru mulai: trademark DJKI, legal entity, monetisasi F2 |

## 6. Implikasi ke Keputusan Berikutnya

| Keputusan | Rekomendasi berdasar budget | Biaya |
|---|---|---|
| **Stack** | **ADOPSI pilihan PRD**: Cloudflare Pages (gratis) + Supabase Free + deepseek pay-as-you-go + search free-tier. Next.js/Vercel juga gratis, tapi Supabase+Cloudflare paling selaras & tanpa komitmen | Rp0 tambahan |
| **Auth** | **Supabase Auth** (email + Google OAuth) — sudah termasuk Free tier, konsisten dengan credit & saved apps | Rp0 tambahan |
| **Monetisasi** | **F1 tanpa iklan** (sesuai `docs/MONETIZATION.md`); afiliasi berlabel opsional. Pilot tidak butuh revenue — fokus validasi | Rp0; potensi komisi kecil bila afiliasi dipakai |

## 7. Kesimpulan

Mulai dengan **±Rp12 juta cash + 300–400 jam founder** untuk 3 bulan pilot (F0–F1), infra running **±Rp150–400k/bln**. Ini menegaskan keputusan stack/auth dari PRD (semuanya tersedia gratis) dan memungkinkan monetisasi ditunda sampai data pasar tervalidasi di akhir F1.

*Referensi: PRD §40–45 (budget AI, cost target), `docs/ROADMAP.md` (F0–F1), `docs/MONETIZATION.md` (tahapan pendapatan).*
