# CuanRadar — Roadmap & Milestone

*Revisi: v1.3 · 2026-09-07 · Living document · Pemetaan Fase strategis (F0–F3) × BUILD*
*Revisi v1.3: deployment awal BUILD 5 diperlakukan sebagai versi legacy yang perlu hardening. BUILD 5.1–5.3 menjadi gate wajib sebelum Public Beta; BUILD 6–7 ditunda sampai hasil beta ditinjau. Rincian: `docs/PUBLIC_BETA_PLAN.md`.*

## Peta Fase

| Fase | BUILD | Durasi | Fokus |
|---|---|---|---|
| **F0 — Fondasi** | Persiapan | 2 minggu | Dokumen final, pre-seed katalog, rubrik, repo/CI, keputusan arsitektur |
| **F1 — Pilot MVP** | **BUILD 1–5** | 8–12 minggu | Produk inti ujung-ke-ujung; versi awal pernah live |
| **F1B — Public Beta Readiness** | **BUILD 5.1–5.3** | Berdasarkan gate | Security, data trust, staging, testing, operasi, dan beta gate |
| **F2 — Growth (setelah beta)** | **BUILD 6–7** | 3–4 bulan | Komunitas, membership/payment setelah keputusan bisnis, ekspansi katalog |
| **F3 — Scale** | Lanjutan | 6+ bulan | PWA push, premium, B2B, kategori baru, ekspansi SEA |

## F0 — Fondasi (2 minggu) ✅

**Deliverable:** PRD v1.1 + dokumen final · rubrik validasi disepakati · pre-seed katalog 30 platform (`data/seed-platforms.json`) · repo + CI · cek trademark informal · keputusan stack final.

**Exit criteria:** Katalog seed lengkap (`risk_level` & `last_verified_at`); rubrik & arsitektur disetujui; CI hijau. *(Terpenuhi.)*

## F1 — Pilot MVP (BUILD 1–5) ✅ implementasi awal

**BUILD 1 (Foundation):** UI mobile-first, auth (Supabase), database schema (entitas v1.1), navigation, profile, rewards foundation, saved apps, scan UI, credits, empty states, security, provider abstractions.

**BUILD 2 (AI Scan core):** SearchProvider, AIProvider, discovery, extraction, candidate filtering, deduplication, database population, Quick Scan cold start, review queue (v1.1), Discovery Lock per tipe scan, eksekusi via background queue/CLI → **edge function `scan`**.

**BUILD 3 (Intelligence):** verification (3 sumbu), reward calculation, estimation, recommendation scoring (6 faktor), reward history, cache + TTL, Budget Governor, cost tracking, fitur Compare, kalkulator asumsi pengguna, CuanScore & provenance di UI.

**BUILD 4 (Refinement):** review queue UI (kandidat menunggu tinjauan), prompt ekstraksi diperkuat, touch target ≥44px, reliability & edge cases.

**BUILD 5 (Production readiness):** security audit (bundle bersih secret), operational controls (Deep Scan wajib login, throttle tamu, dedup vs katalog+queue), sanitasi error server, analytics PostHog opsional (dynamic import), deploy live `cuanradar.pages.dev` + edge function, cost/performance optimization.

**Catatan status:** versi awal pernah live di `cuanradar.pages.dev`, tetapi audit lanjutan menemukan gap keamanan, data trust, staging, dan operasi. Karena itu, "pernah live" tidak sama dengan Public Beta Ready.

## F1B — Public Beta Readiness (BUILD 5.1–5.3) 🔧

- **BUILD 5.1A–D:** authorization/RLS; kuota/rate/idempotency; Budget Governor/provider controls; security test dan CI. Implementasi lokal selesai, menunggu rollout staging.
- **BUILD 5.2:** data trust, evidence, review queue dan approval editor, audit trail, re-verification.
- **BUILD 5.3:** environment staging/production, integration/E2E, observability, backup/restore, rollback, legal pages, Lighthouse, dan beta gate.
- **Public Beta:** uji 100–300 pengguna; lanjut/pivot/henti diputuskan dari KPI dan risiko.

**Exit criteria:** seluruh gate `docs/PUBLIC_BETA_PLAN.md` §8 lulus. Sebelum itu status proyek tetap **belum Public Beta Ready**.

## F2 — Growth (BUILD 6–7, 3–4 bulan)

**BUILD 6 (Komunitas setelah beta):**
- `payout_reports` & `community_reports` live dengan moderasi bertingkat (≥2 konfirmasi + editor).
- **Alur tinjauan editor** review_queue: approve → `reward_apps`, reject → discard (CLI/SQL/UI admin).
- Persiapan packaging plan dapat dilakukan, tetapi pembayaran belum diaktifkan sampai hasil beta dan keputusan founder menyetujui harga/aturan bisnis.
- Alert penawaran (email) · afiliasi berlabel + iklan native · re-verifikasi terjadwal (30 hari).
- Lighthouse ≥90 & aksesibilitas audit; seed `reward_offers` (estimated_menit, reward_value) → kalkulator `basedOn:'data'`.

**BUILD 7 (Membership, payment, dan ekspansi):**
- Membership/payment: webhook aman, entitlement server-side, idempotency, rekonsiliasi, refund/cancel, audit log, serta legal/commercial readiness.
- Ekspansi katalog & platform **50+** (aktifkan status `Fase 2` di katalog: telecom, survey, miles, kartu, dst.).
- Auth penuh: `scan_credits` per plan (Free/Pro/Pro+) & kuota real per user; staging/prod Supabase terpisah.
- Analytics aktif (PostHog key) + error monitoring; domain custom `cuanradar.id` + DNS Cloudflare.
- Guest quick scan eksperimen (opsional).

**Exit criteria F2:** 50+ platform; 10k MAU; ≥30% offer terverifikasi payout; false-positive <10%; false-negative <1%; churn <8%; biaya AI stabil; MRR mulai positif (Pro).

## F3 — Scale (6+ bulan)

**Deliverable:** PWA push notification & offline penuh · premium scaling (Pro+, annual) · B2B insights agregat anonim · kategori baru (telecom, survey, miles, kartu) · ekspansi regional (SEA) jika tervalidasi.

**Exit criteria:** MRR positif; kontrak B2B pertama; NPS ≥40.

## KPI per Fase (ringkas)

| KPI | F1/F1B | F2 | F3 |
|---|---|---|---|
| Platform terpantau | 30 | 50+ | 100+ |
| % offer terverifikasi payout | mulai diukur | ≥30% | ≥60% |
| False-positive verifikasi | <10% | <10% | <5% |
| False-negative scam | <1% | <1% | <0,5% |
| Scan completion rate | >90% | >90% | >95% |
| Avg Deep Scan cost | ≤US$0.01 | ≤US$0.01 | turun |
| MAU | 100 (beta) | 10k | 50k+ |
| NPS | — | mulai diukur | ≥40 |

## Aturan Perubahan

- **Build berikutnya tidak boleh mengubah fundamental PRD tanpa keputusan eksplisit** (PRD §64).
- **BUILD 6+ adalah perluasan roadmap** (PRD §64 hanya mendefinisikan BUILD 1–5) — isi F2/F3 mengikuti prinsip PRD & `docs/AI_RULES.md`; jika menyentuh fundamental PRD (model data, skor, kuota), catat sebagai revisi PRD yang disetujui.
- Setiap perubahan rubrik/bobot skor dicatat (`bobot_version`) dan diumumkan.
- Setiap fase punya gate review: lanjut / pivot / henti berdasarkan exit criteria di atas.
