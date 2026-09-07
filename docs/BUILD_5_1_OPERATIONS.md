# BUILD 5.1 — Operations Drill

Status: **staging only** · production tidak disentuh.

## Bukti yang sudah diverifikasi

*2026-09-07 — Supabase `CuanRadar Staging` (`ojdqlhznveomahfrxmwn`)*

- Edge Function `scan` aktif pada versi 7. Source yang diunduh melalui Supabase API memiliki SHA-256 yang sama dengan `supabase/functions/scan/index.ts` di branch ini.
- Deployment preview Cloudflare `2e97dfd2` dan `eefecb8f`, serta alias branch `codex-build-5-1-security-har.cuanradar.pages.dev`, merespons `200` dengan CSP dan `X-Content-Type-Options: nosniff`.
- Riwayat deployment Cloudflare masih menyimpan artefak preview lama dan baru sebagai URL immutable.
- Staging melaporkan `pitr_enabled=false`, tidak memiliki physical backup, dan tidak memiliki preview database branch.
- Percobaan logical dump tidak menghasilkan backup karena Docker Desktop belum tersedia. Dua file kosong hasil percobaan telah dihapus.

## Audit log

Audit dilakukan pada tiga sumber berikut untuk rentang sejak deployment terakhir:

1. `function_edge_logs`: status, method, path, durasi, dan request ID untuk fungsi `scan`.
2. `function_logs`: `booted`, `shutdown`, error aplikasi, dan request ID terkait.
3. `postgres_logs`: error RPC `consume_api_rate_limit`, `consume_scan_quota`, `refund_scan_quota`, dan `reserve_provider_budget`.

Kriteria lulus:

- tidak ada API key, JWT, service-role key, payload kandidat, email, atau IP mentah;
- tidak ada error `5xx` yang belum dijelaskan;
- error provider hanya berisi klasifikasi tersanitasi dan request ID;
- request concurrency setelah migrasi `0003` hanya menghasilkan status kontrak `200`, `409`, atau `429`.

CLI Supabase tidak menyediakan query ClickHouse logs. Jalankan audit melalui Supabase Logs Explorer, atau Management API dengan `SUPABASE_ACCESS_TOKEN` yang diberikan secara eksplisit lewat environment; jangan mengekstrak token dari credential store OS.

## Backup dan restore terisolasi

Prasyarat: Docker Desktop aktif, atau Supabase preview branch terpisah yang pengguna setujui. Jangan menjalankan restore ke staging aktif.

```powershell
npx supabase db dump --linked --schema public --file <temp>\schema.sql
npx supabase db dump --linked --schema public --data-only --use-copy --file <temp>\data.sql
```

Setelah dump:

1. catat ukuran dan SHA-256 kedua file;
2. restore ke Postgres lokal/branch disposable;
3. terapkan seluruh migrasi sampai `0003`;
4. cocokkan jumlah row tabel katalog dan tabel operasional non-sensitif;
5. jalankan Quick Scan dan contract test;
6. hapus database disposable dan dump temporary secara aman.

Restore dinyatakan lulus hanya jika schema, data, migrasi, dan smoke test semuanya berhasil. Keberadaan file dump saja tidak cukup.

## Rollback

Urutan rollback staging:

1. hentikan trafik preview atau keluarkan origin preview dari `ALLOWED_ORIGINS`;
2. database: gunakan forward corrective migration—jangan menghapus migration history atau menjalankan `git reset`;
3. Edge Function: deploy ulang source dari commit terakhir yang diketahui sehat, lalu verifikasi version/hash dan Quick Scan;
4. frontend: deploy ulang artefak commit sehat ke branch preview; URL deployment lama tetap menjadi pembanding immutable;
5. pulihkan origin, jalankan smoke test, lalu periksa log dan counter.

Rollback penuh belum boleh dinyatakan lulus sebelum cutover ke artefak lama dan roll-forward ke artefak saat ini benar-benar diuji pada environment disposable atau staging dengan maintenance window yang disetujui.
