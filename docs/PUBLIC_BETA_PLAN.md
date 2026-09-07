# CuanRadar — Public Beta Readiness Plan

*Keputusan operasional v1.0 · 2026-09-07 · berlaku bersama PRD dan `docs/AI_RULES.md`*

Dokumen ini mengubah rekomendasi Public Beta terbaru menjadi rencana kerja yang dapat dieksekusi. Jika status lama di log bertentangan dengan dokumen ini, gunakan dokumen ini, `docs/ROADMAP.md`, dan status branch terbaru sebagai acuan. Log lama tetap dipertahankan sebagai histori.

## 1. Target dan batas

Target terdekat adalah **Public Beta Ready**, bukan Commercial Ready. Pembayaran, membership berbayar, dan ekspansi komunitas tidak boleh diaktifkan sebelum beta gate lulus dan hasil uji 100–300 pengguna ditinjau.

- **Public Beta Ready:** alur inti aman dan teruji, data AI tidak dipublikasikan tanpa persetujuan editor, staging dan production terpisah, monitoring/rollback/backup siap, serta tidak ada bug P0/P1.
- **Commercial Ready:** seluruh syarat Public Beta ditambah pembayaran, webhook aman, entitlement server-side, legal/operasional komersial, monitoring biaya, dan pemulihan insiden.

## 2. Tahap build yang berlaku

| Tahap | Fokus | Exit minimum |
|---|---|---|
| **BUILD 5.1A** | RLS, authorization, review-queue privacy | Tes akses lintas role lulus; kandidat mentah tidak tampil publik |
| **BUILD 5.1B** | Kuota atomik, rate limit, idempotency | Tes concurrency dan duplicate request lulus; error kuota fail-closed |
| **BUILD 5.1C** | Budget Governor, provider controls, cache-only mode | Hard cap harian/bulanan dan emergency stop teruji |
| **BUILD 5.1D** | Security tests, CI, dependency/secret scanning | CI hijau; scanning aktif sesuai kemampuan repo |
| **BUILD 5.2** | Data trust, evidence, moderasi/editor workflow | Tidak ada kandidat AI masuk katalog tanpa approval dan audit trail |
| **BUILD 5.3** | Staging, integration/E2E, observability, beta gate | Backup/restore dan rollback teruji; seluruh gate §8 lulus |
| **Public Beta** | Uji terbatas 100–300 pengguna | KPI validasi ditinjau sebelum BUILD 6/7 atau pembayaran |
| **BUILD 6** | Community/reporting setelah beta | Dimulai hanya setelah keputusan lanjut/pivot/henti |
| **BUILD 7** | Membership dan payment | Memerlukan persetujuan plan, harga, provider, dan aturan bisnis |

Satu perubahan besar dikerjakan dalam satu branch/PR kecil. Jangan mencampur security, UI redesign, community, dan payment dalam PR yang sama.

## 3. Model untuk development

| Pekerjaan | Model yang disarankan |
|---|---|
| Arsitektur, RLS, auth, kuota, Edge Function, refactor lintas file | GPT-5.6 Sol Medium |
| Implementasi frontend standar | GPT-5.6 Terra Medium |
| Test boilerplate, cleanup, dan dokumentasi sederhana | GPT-5.6 Luna Medium |
| Review kedua untuk perubahan sempit | GPT-6 Astra Light |
| Audit akhir lintas sistem | GPT-5.6 Sol Medium atau Astra Medium bila tersedia |

Jangan mengganti model di tengah satu paket perubahan besar. Model development bukan dependency runtime CuanRadar dan tidak boleh hard-coded ke aplikasi.

## 4. Provider beta dan alur data

Pilihan operasional per 2026-09-07:

| Fungsi | Pilihan beta |
|---|---|
| Quick Scan | Database + shared cache; tanpa search/AI |
| Deep Scan search utama | Brave Search API |
| Search fallback | Serper; hanya bila Brave tidak memadai atau editor meminta verifikasi kedua |
| Ekstraksi/kurasi | `deepseek-v4-flash`, non-thinking, output JSON, temperature rendah/deterministik |
| Perhitungan reward dan CuanScore | Kode deterministik, bukan LLM |
| Publikasi | Persetujuan human/editor wajib |
| AI fallback | Adapter Gemini boleh disiapkan tetapi tidak aktif acak di beta |

Harga, kredit gratis, nama model, dan terms provider dapat berubah. Verifikasi ulang dashboard/dokumentasi resmi sebelum staging dan catat tanggalnya. Budget Governor memakai nilai konfigurasi, bukan harga yang ditanam di kode.

Alur wajib: **database/cache → search bila stale → filter deterministik → satu batch AI → schema validation/deduplication → review queue → approval editor → katalog publik**.

## 5. Batas biaya dan penggunaan

- Guest hanya memakai Quick Scan berbasis database/cache.
- Pengguna login: maksimum 3 Quick Scan/hari.
- Deep Scan: maksimum 1 permintaan/hari; permintaan tidak selalu memicu discovery baru.
- Satu discovery: maksimum 2–3 query, 15 raw results per query, dan 5 kandidat baru ke review queue.
- Satu request AI per batch, maksimum satu retry, dan output sekitar 1.000–1.500 token.
- Shared cache memakai `country + category + filters + freshness_window`.
- Freshness awal: entertainment 12–24 jam; shopping/wallet 6–12 jam; platform umum 24–72 jam; offer segera kedaluwarsa lebih cepat.
- Hard cap harian dan bulanan harus fail-closed. Target desain beta adalah biaya provider di bawah US$10–20/bulan, bukan jaminan.

## 6. Trust dan evaluasi AI

Sebelum pergantian model produksi, siapkan 100–200 sampel berlabel manusia: sumber pencarian, platform/kategori/reward/payout yang benar, sinyal risiko, kelayakan review, dan field yang harus `unknown`.

Bandingkan model dengan precision, false positive, hallucinated fields, invalid JSON, duplikasi, latency, dan biaya per kandidat valid. Model tidak dipilih hanya berdasarkan harga token.

Urutan kepercayaan sumber:

1. Situs resmi platform.
2. Google Play/App Store resmi.
3. Syarat dan ketentuan resmi.
4. Akun media sosial resmi.
5. Media terpercaya.
6. Forum/komunitas hanya sebagai sinyal risiko.
7. Sumber tidak jelas tidak boleh dipublikasikan.

Satu laporan komunitas tidak cukup untuk label `verified` atau `scam`.

## 7. Environment dan emergency controls

Sebelum Public Beta harus tersedia Supabase staging dan production, Cloudflare Preview dan Production, API key terpisah, migration version-controlled yang sama, serta seed khusus staging. Eksperimen dilarang langsung pada data production.

Kontrol server-side wajib dapat:

- mematikan Deep Scan atau satu provider;
- beralih ke cache-only;
- menonaktifkan pendaftaran baru;
- menyembunyikan seluruh kandidat belum terverifikasi;
- mengubah batas kuota tanpa redeploy frontend;
- menghentikan AI/search saat biaya atau error melonjak.

## 8. Public Beta gate

CuanRadar hanya boleh diberi status Public Beta Ready jika:

- seluruh temuan keamanan kritis sudah diperbaiki;
- review queue editor-only dan diuji;
- RLS, kuota concurrency, Quick/Deep Scan, request validation, dan unauthorized access diuji otomatis;
- Budget Governor dan emergency stop teruji;
- tidak ada kandidat AI dipublikasikan tanpa approval;
- staging/production terpisah dan migration staging lulus;
- rollback deployment serta backup/restore database pernah diuji;
- error monitoring dan audit log aktif;
- Privacy Policy, Terms, reward disclaimer, dan affiliate disclosure tersedia;
- Lighthouse mobile target ≥90 untuk performance, accessibility, best practices, dan SEO, atau pengecualian tertulis disetujui;
- tidak ada bug P0/P1 terbuka;
- minimal satu beta internal selesai sebelum undangan publik.

## 9. Operasional manusia

Tetapkan editor, SLA review 24–48 jam, prosedur approve/reject, laporan scam, koreksi offer kedaluwarsa, penghapusan akun/data, email dukungan, halaman status, dan audit log untuk perubahan penting. Verifikasi manusia adalah bagian produk, bukan pekerjaan opsional di luar sistem.

## 10. Release management

- Repository kanonik: `manasumiraka-droid/CuanRadar`.
- Lindungi `main`; gunakan branch dan Pull Request per build.
- Jalankan CI, review diff, audit dependency dan secret/history sebelum merge.
- Gunakan version tag, changelog, ADR, dan `docs/HANDOFF_PUBLIC_BETA.md`.
- Jangan deploy, merge, atau push langsung ke `main` tanpa persetujuan eksplisit.

