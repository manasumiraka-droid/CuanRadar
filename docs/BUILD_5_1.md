# BUILD 5.1 — Public Beta Security Hardening

Status: **implementation branch** (`codex/build-5.1-security-hardening`) · belum diterapkan ke production.

## Log rollout staging

*2026-09-07 — Supabase project `CuanRadar Staging` (`ojdqlhznveomahfrxmwn`)*

- [x] Repo ditautkan ke project staging yang terpisah dari production.
- [x] Dry-run migrasi memverifikasi urutan `0001_init.sql` → `0002_build_5_1_security_hardening.sql`.
- [x] Kedua migrasi berhasil diterapkan ke staging.
- [ ] Secret provider dan kontrol operasional staging belum dikonfigurasi.
- [ ] Edge Function `scan` dan frontend preview belum di-deploy.
- [ ] Smoke test serta pemeriksaan audit/budget belum dijalankan.

Production belum disentuh. Jangan melanjutkan deploy fungsi sebelum seluruh secret wajib tersedia.

## Scope yang diimplementasikan

- Akses review queue memerlukan login dan role `editor`/`admin` dari `app_metadata`; response Deep Scan dan UI publik hanya menampilkan jumlah kandidat, bukan payload mentah.
- Policy `scan_history` dan `scan_credits` menjadi read-only untuk pemilik. Konsumsi kuota dilakukan melalui fungsi database atomik.
- Rate limit scan disimpan secara atomik per user atau IP tamu yang sudah di-hash dengan salt.
- Deep Scan memakai reservasi budget harian sebelum memanggil Search/AI provider.
- Request scan divalidasi ketat, memakai `Idempotency-Key`, batas payload, CORS allowlist, timeout provider, dan error publik yang disanitasi.
- Audit metadata menyimpan request ID, jumlah request provider, token, model, serta biaya aktual.
- Header keamanan Cloudflare Pages, unit/security test, dependency audit, Dependabot, dan Deno typecheck ditambahkan.

## Konfigurasi wajib sebelum deployment

Set Supabase Edge Function secrets berikut:

```text
SUPABASE_SERVICE_ROLE_KEY
SEARCH_PROVIDER=tavily
SEARCH_API_KEY
DEEPSEEK_API_KEY
DEEPSEEK_MODEL=deepseek-v4-flash
ALLOWED_ORIGINS=https://cuanradar.pages.dev
RATE_LIMIT_SALT=<nilai acak minimal 32 byte>
DAILY_PROVIDER_BUDGET_USD=1
SEARCH_COST_PER_REQUEST_USD=0
AI_INPUT_USD_PER_MILLION=0.44
AI_OUTPUT_USD_PER_MILLION=1.32
AI_RESERVED_INPUT_TOKENS=12000
```

Harga provider berubah dari waktu ke waktu. Nilai biaya di atas adalah parameter operasional dan harus disesuaikan dengan dashboard provider sebelum deployment.

Tavily `basic` adalah provider utama beta dengan free tier bulanan; harga efektif dikonfigurasi `0` selama pemakaian tetap di dalam kuota gratis. Serper tetap didukung sebagai fallback/manual verification, tetapi fallback otomatis belum boleh menambah biaya tanpa batas dan harus tunduk pada Budget Governor. DeepSeek dijalankan dalam mode non-thinking dengan output JSON yang divalidasi; exact request contract wajib di-smoke-test terhadap API staging sebelum rollout.

## Urutan rollout aman

1. Buat backup database dan catat versi fungsi production.
2. Terapkan migrasi `0002_build_5_1_security_hardening.sql` pada staging/test project.
3. Set seluruh secret, kemudian deploy Edge Function `scan`.
4. Deploy frontend preview dari branch ini.
5. Tambahkan URL preview sementara ke `ALLOWED_ORIGINS`, lalu jalankan smoke test: anonymous Quick, authenticated Quick/Deep, kuota habis, duplicate idempotency, budget habis, origin ditolak, dan akses review queue non-editor.
6. Periksa `scan_history` serta `provider_budget_daily`; pastikan tidak ada secret atau payload sensitif di log.
7. Setelah lolos, ulangi migration → function → frontend di production. Jangan membalik urutan ini.

## Batas BUILD 5.1

- Deep Scan masih berjalan sinkron di Edge Function. Background queue, retry worker, dan status polling nyata tetap menjadi pekerjaan berikutnya sebelum trafik diperbesar.
- Belum ada UI editor untuk approve/reject kandidat. Endpoint baca sudah dibatasi role, tetapi alur moderasi lengkap harus dibangun terpisah.
- Migrasi harus diuji pada project Supabase staging; test lokal saat ini memverifikasi kontrak SQL, bukan mengeksekusi Postgres/Supabase penuh.
- Observability eksternal dan alert budget belum aktif sampai credentials/tujuan alert dikonfigurasi.
