# CuanRadar — Public Beta Handoff

*Update: 2026-09-07*

## Posisi saat ini

- Branch: `codex/build-5.1-security-hardening`.
- BUILD 5.1A–5.1D telah diimplementasikan secara lokal dan quality gates lokal lulus.
- Versi lama pernah di-deploy ke `cuanradar.pages.dev`; hardening branch ini belum diterapkan ke staging atau production.
- Status yang benar: **belum Public Beta Ready**.

## Perubahan BUILD 5.1

- Review queue hanya untuk `editor`/`admin`; payload kandidat mentah tidak dikirim ke UI publik.
- RLS `scan_history`, `scan_credits`, dan laporan diperketat.
- Kuota, rate limit, dan reservasi budget menjadi operasi database atomik.
- Request validation, payload limit, CORS allowlist, idempotency, timeout, dan sanitasi error ditambahkan.
- Provider usage dan estimasi biaya dicatat; Cloudflare security headers, security tests, CI, dan Dependabot ditambahkan.

## Quality gates lokal terakhir

- 12/12 test lulus.
- Typecheck frontend lulus.
- Production build lulus.
- Deno Edge Function check lulus.
- `npm audit`: 0 vulnerability.
- `git diff --check`: bersih.

Hasil ini tidak menggantikan integration test pada Supabase staging nyata.

## Belum dilakukan

- Migration `0002_build_5_1_security_hardening.sql` pada Supabase staging.
- Deploy Edge Function dan frontend preview dari branch ini.
- Smoke test provider nyata, RLS nyata, concurrency, rollback, backup/restore, serta monitoring.
- UI dan workflow approve/reject editor (BUILD 5.2).
- Dataset evaluasi AI 100–200 sampel.
- Legal pages lengkap dan Public Beta gate (BUILD 5.3).

## Urutan berikutnya

1. Push branch dan buka Pull Request tanpa merge.
2. Siapkan environment staging terpisah dan secrets sesuai `docs/DEPLOYMENT.md`.
3. Terapkan migration, deploy function lalu frontend preview.
4. Jalankan checklist `docs/BUILD_5_1.md` dan rekam hasilnya.
5. Lanjut BUILD 5.2, lalu BUILD 5.3 berdasarkan `docs/PUBLIC_BETA_PLAN.md`.

## Sumber kebenaran

Urutan prioritas: `PRD-CuanRadar.md` → `docs/AI_RULES.md` → `docs/PUBLIC_BETA_PLAN.md` → `docs/ROADMAP.md` → dokumen build/handoff. Log F0/F1 adalah histori dan tidak boleh mengalahkan status terbaru.

