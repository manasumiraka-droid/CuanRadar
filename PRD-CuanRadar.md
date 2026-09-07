**CuanRadar**

**PRODUCT REQUIREMENTS DOCUMENT**

**Pilot Version 1.1**

**Status:** Final Draft — Development Baseline  
**Target:** Pilot / MVP  
**Target Market:** Indonesia  
**Platform:** Responsive Web App / Mobile-first  
**Architecture Principle:** Low Cost, AI-assisted, Database-first

---

**REVISION LOG — v1.0 → v1.1**

Tanggal: *(isi tanggal revisi)*  
Sifat: Revisi konseptual berdasarkan audit menyeluruh + integrasi rencana strategis (lihat `docs/STRATEGY.md`). Versi 1.0 tetap terbaca di bawah sebagai baseline historis; bagian yang direvisi ditandai *(direvisi v1.1)*.

Ringkasan perubahan (peta koreksi):

| # | Koreksi | Lokasi di dokumen |
|---|---------|-------------------|
| A | Pisahkan tiga sumbu: `verification_status` (data) vs `risk_level` (platform) vs `offer_status` (lifecycle); EXPIRED pindah ke offer_status | §28 + Appendix A1 |
| B | Entitas baru: `payout_reports` & `community_reports` (bukti reward cair) + alur moderasi | §59 + Appendix A2 |
| C | Data sufficiency ditentukan per cakupan scan; "All" = 12 (bukan 5) | §14 |
| D | Pre-seed katalog di F0; Discovery Lock TTL mengikuti tipe scan; eksekusi scan via background queue | §16 + Appendix A3 |
| E | Budget $10/bln dipecah LLM vs Search; search free-tier untuk pilot | §40, §42 |
| F | Skema skor tunggal 6 faktor (tambah Platform Risk & definisi ulang bobot) | §32, §35 |
| G | Kalkulator: asumsi pengguna berlabel; fitur Compare ditambahkan | Appendix A4, A5 |
| H | Review queue (kurasi manusia) sebelum publish; kebijakan afiliasi eksplisit | Appendix A6, A7 |
| I | Kebijakan konten & legal eksplisit (larangan investasi/staking; disclaimer; UU PDP) | Appendix A8 |
| J | KPI tambahan untuk akurasi anti-scam | §67 |
| K | Provenance hasil scan ditampilkan di UI ("database terverifikasi" vs "hasil baru") | §63 + Appendix A9 |
| L | Skema kredit §39 direvisi → kuota harian per plan (Free/Pro/Pro+); metode pembayaran Indonesia direkomendasikan (QRIS/e-wallet + opsi autodebit) | §39 + `docs/MONETIZATION.md` |

Dokumen terkait yang melengkapi PRD ini: `docs/PLATFORM_CATALOG.md`, `docs/VALIDATION_RUBRIC.md`, `docs/ARCHITECTURE.md`, `docs/MONETIZATION.md`, `docs/RISKS.md`, `docs/ROADMAP.md`.

**1\. EXECUTIVE SUMMARY**

**CuanRadar** adalah aplikasi yang membantu pengguna menemukan dan membandingkan berbagai **reward earning opportunities** dari aplikasi dan layanan digital yang tersedia bagi pengguna Indonesia.

CuanRadar tidak menjadi aplikasi tempat pengguna melakukan aktivitas earning secara langsung.

Fungsinya adalah:

**Discover/Tracking → Compare → Estimate → Verify → Choose**

CuanRadar membantu pengguna mengetahui:

- aplikasi apa yang memiliki reward;
- jenis reward yang tersedia;
- aktivitas yang diperlukan;
- perkiraan nilai reward;
- tingkat usaha yang diperlukan;
- apakah reward dapat diverifikasi;
- kapan informasi terakhir diverifikasi;
- dan link resmi untuk mengakses aplikasi.

Pada tahap pilot, CuanRadar berfokus pada empat kategori:

1. **Entertainment**
2. **Shopping**
3. **Digital Wallet — Limited**
4. **Kategori lainnya**

AI Scan menjadi fitur utama yang memungkinkan CuanRadar menemukan peluang reward baru dari internet, tetapi AI tidak digunakan secara terus-menerus.
(Karena ini masih tahap planning fitur AI Scan sebagai fitur utama masih bisa dikembangkan jika ada fitur model ada yang lebih baik dan efektif dan efisien.) 

Arsitektur utama:

**Database-first → Cache-first → AI-second → Web-search-on-demand**

Tujuan utamanya adalah menciptakan pengalaman yang terasa cerdas dengan **biaya operasional serendah mungkin**.

**2\. PRODUCT VISION**

CuanRadar ingin menjadi:

**Personal reward opportunity discovery assistant.**

Gunakan tagline "Setiap menit waktu anda berharga" agar terkesan lebih realistis.
Bukan sekadar daftar aplikasi reward.

Untuk Tujuan akhir CuanRadar dapat menjawab pertanyaan seperti:

"Apa peluang reward terbaik yang tersedia untuk saya hari ini?"

atau:

"Mana yang paling menguntungkan untuk setiap waktu dan usaha yang saya keluarkan?"

**3\. PROBLEM STATEMENT**

Pengguna sering menemukan informasi earning/reward melalui:

- TikTok
- YouTube
- Facebook
- website
- komunitas
- referral
- iklan
- aplikasi tertentu

Masalahnya:

**1\. Informasi tersebar**

Pengguna harus mencari sendiri.

**2\. Informasi cepat berubah**

Reward hari ini belum tentu berlaku besok.

**3\. Sulit membandingkan**

Contoh:

App A

Rp5.000/task

App B

5% cashback

App C

Rp20.000/week

Nominal tersebut tidak dapat dibandingkan secara langsung tanpa memahami aktivitas dan effort.

**4\. Banyak informasi tidak jelas**

Tidak semua reward:

- resmi;
- masih aktif;
- tersedia di Indonesia;
- mudah dicairkan.

**5\. Pengguna mudah terjebak ekspektasi berlebihan**

CuanRadar harus menghindari klaim:

"Anda pasti mendapatkan Rp500.000/bulan."

**4\. SOLUTION**

CuanRadar menyediakan satu tempat untuk:

**DISCOVER**

Tracking dan menemukan reward opportunity.

**COMPARE**

Membandingkan reward.

**ESTIMATE**

Menghitung potensi reward berdasarkan data yang tersedia.

**VERIFY**

Menampilkan status verifikasi dan sumber.

**CHOOSE**

Memberikan link resmi untuk melanjutkan aktivitas di aplikasi terkait.

**5\. TARGET USERS**

**Primary User**

Pengguna Indonesia yang:

- aktif menggunakan smartphone;
- menggunakan aplikasi hiburan/shopping/wallet/aplikasi lainnya;
- tertarik mendapatkan reward tambahan;
- ingin menemukan peluang tanpa harus mencari manual;
- sensitif terhadap effort vs reward.

**Secondary User**

Pengguna yang:

- sering mencoba promo;
- mencari cashback;
- mencari aplikasi reward;
- suka membandingkan peluang earning.

**6\. PRODUCT POSITIONING**

CuanRadar bukan:

- e-commerce;
- digital wallet;
- bank;
- platform investasi;
- aplikasi pinjaman;
- aplikasi mining;
- platform earning langsung.

CuanRadar adalah:

**Reward Discovery & Recommendation Platform**

**7\. CORE PRODUCT LOOP**

USER

↓

SCAN

↓

DISCOVER

↓

FILTER

↓

VERIFY

↓

CALCULATE

↓

RANK

↓

RECOMMEND

↓

USER CHOOSES

↓

OPEN OFFICIAL APP

**8\. CORE FEATURES**

**Feature 1 — AI Scan**

Fitur utama CuanRadar.

AI Scan mencari dan mengkurasi aplikasi yang memiliki:

- cashback;
- points;
- referral reward;
- task reward;
- promotional reward;
- entertainment reward;
- shopping reward;
- wallet reward yang tersedia secara publik.

AI Scan memiliki dua mode:

**Quick Scan**

Untuk hasil cepat dan hemat biaya.

**Deep Scan**

Untuk pencarian peluang baru yang lebih luas.

**9\. CATEGORY SYSTEM**

**Entertainment**

Contoh tipe peluang:

- watch/reward;
- task;
- content interaction;
- promotional reward;
- points.

**Shopping**

Contoh:

- cashback;
- shopping points;
- promotional reward;
- referral;
- purchase-based reward.

**Wallet — LIMITED**
**Kategori-lainnya — LIMITED**

Contoh:

- cashback;
- promotional reward;
- transaction reward;
- referral;
- points.
- kategori lainnya.

CuanRadar **tidak**:

- mengakses akun wallet;
- membaca saldo;
- melakukan transaksi;
- melakukan transfer;
- melakukan withdrawal;
- menyimpan PIN;
- menyimpan OTP.

**10\. AI SCAN ARCHITECTURE**

Arsitektur fundamental:

DATABASE-FIRST

↓

CACHE-FIRST

↓

AI-SECOND

↓

WEB-SEARCH-ON-DEMAND

Tujuannya:

Jangan melakukan pencarian internet jika informasi yang valid sudah tersedia.

**11\. QUICK SCAN**

Quick Scan adalah mode utama yang dirancang untuk penggunaan sehari-hari.

Normal flow:

Quick Scan

↓

Check Cache

↓

Check Database

↓

Sufficient?

↓

YES

↓

Calculate

↓

Rank

↓

Return

Tidak perlu web search jika data mencukupi.

**12\. QUICK SCAN — COLD START**

Karena database pada awal peluncuran mungkin kosong, Quick Scan memiliki **Cold Start Logic**.

Jika:

Cache = empty

Database = insufficient

maka:

Light Discovery

↓

Candidate Filtering

↓

Reward Extraction

↓

Basic Verification

↓

Save Database

↓

Create Cache

↓

Calculate

↓

Return

Jadi Quick Scan **tidak gagal hanya karena database masih kosong**.

**13\. LIGHT DISCOVERY LIMIT**

Cold Start Quick Scan tidak boleh berubah menjadi Deep Scan.

Hard limit:

| **Resource**        | **Limit** |
| ------------------- | --------- |
| Search queries      | ≤ 2       |
| Raw candidates      | ≤ 10      |
| Extraction          | ≤ 7       |
| Deeper verification | ≤ 3       |
| AI retry            | ≤ 1       |

Jika hasil kurang dari threshold:

Tampilkan apa yang berhasil ditemukan.

Jangan mengarang hasil.

**14\. DATA SUFFICIENCY**

Quick Scan tidak hanya memeriksa apakah database kosong.

Ia memeriksa apakah data **cukup**.

Baseline *(direvisi v1.1 — per cakupan scan, bukan global)*:

| **Cakupan Scan** | **Minimum valid apps** |
| ---------------- | ---------------------- |
| Entertainment    | 4                      |
| Shopping         | 4                      |
| Wallet           | 2                      |
| Kategori lain    | 2                      |
| All (gabungan)   | 12 (4+4+2+2)           |

Contoh: scan kategori Shopping hanya mengecek minimum Shopping (4). Scan "All" mengecek gabungan minimum (12). Sistem TIDAK mengisi cakupan yang tidak diminta pengguna demi memenuhi angka global.

Jika data kurang pada cakupan yang dipilih:

Partial Cold Start / Incremental Discovery.

**15\. INCREMENTAL DISCOVERY**

Misalnya:

Database = 2 Shopping Apps

Quick Scan dapat mencari tambahan.

Jika menjadi:

4 apps

masih belum cukup.

Tetapi jika pencarian berikutnya tidak menemukan peluang baru:

sistem berhenti.

CuanRadar tidak boleh melakukan pencarian tanpa batas hanya untuk mencapai angka minimum.

**16\. DISCOVERY LOCK**

Untuk mencegah banyak pengguna memicu pencarian yang sama:

User A → Discovery

User B → WAIT

User C → WAIT

User D → WAIT

Setelah discovery selesai:

Database updated

↓

semua user menggunakan data baru

Lock memiliki TTL agar tidak macet jika proses gagal.

Baseline TTL *(direvisi v1.1 — mengikuti tipe scan, karena Deep Scan bisa melebihi 60 detik)*:

| **Tipe scan** | **Discovery Lock TTL** |
| ------------- | ---------------------- |
| Quick Scan    | 60 detik               |
| Deep Scan     | 10 menit               |

Lock memakai mekanisme lease (dapat diperpanjang selama discovery masih berjalan) dan auto-release saat scan selesai atau gagal.

**17\. DEEP SCAN**

Deep Scan digunakan untuk:

menemukan peluang baru yang belum ada dalam database.

Flow:

Deep Scan

↓

Internet Discovery

↓

Candidate Collection

↓

Filtering

↓

Extraction

↓

Verification

↓

Database

↓

Calculation

↓

Ranking

**18\. DEEP SCAN LIMIT**

Baseline:

| **Resource**               | **Limit** |
| -------------------------- | --------- |
| Search queries             | ≤ 6       |
| Raw candidates             | ≤ 30      |
| Candidates after filtering | ≤ 10      |
| Deep verification          | ≤ 5       |
| Premium-model verification | ≤ 2       |
| AI retries                 | ≤ 2       |

Tidak boleh ada autonomous unlimited browsing.

**19\. SEARCH PROVIDER**

Search harus diabstraksikan:

SearchProvider

├── Google Search

├── OpenRouter Search

└── Future provider

Untuk pilot, provider awal dapat menggunakan:

**deepseek + Google Search grounding**

tetapi arsitektur tidak boleh bergantung permanen pada satu provider.

**20\. AI PROVIDER**

AI juga diabstraksikan:

AIProvider

├── deepseek

├── OpenRouter

└── Future providers

Build awal tidak boleh menyebarkan deepseek API call ke seluruh codebase.

**21\. AI ROLE**

AI digunakan untuk:

**Discovery**

Membantu menemukan kandidat.

**Extraction**

Mengubah informasi web menjadi structured data.

**Filtering**

Membantu menentukan relevansi.

**Verification**

Membantu membaca evidence.

**Conflict resolution**

Digunakan hanya jika diperlukan.

**22\. AI BUKAN CALCULATOR**

Perhitungan dilakukan oleh code.

Contoh:

5% × Rp100.000

\=

Rp5.000

Tidak meminta LLM menghitung.

**23\. AI MODEL ROUTING**

Prinsip:

Discovery

→ cheap model

Extraction

→ cheap model

Filtering

→ rules + cheap model

Verification

→ mid model

Conflict

→ premium model only when needed

Calculation

→ code

Scoring

→ deterministic code

Tujuannya:

Model mahal hanya digunakan ketika benar-benar diperlukan.

**24\. REWARD DATA MODEL**

Data reward terdiri dari:

Reward App

↓

Reward Offer

↓

Reward Source

↓

Verification

↓

Reward History

**25\. REWARD APP**

Menyimpan informasi aplikasi:

- name;
- developer;
- category;
- description;
- official URL;
- store URL;
- icon;
- country;
- status.

**26\. REWARD OFFER**

Menyimpan:

- reward type;
- reward value;
- reward unit;
- activity;
- conditions;
- minimum activity;
- maximum reward;
- minimum withdrawal;
- validity;
- currency.

**27\. SOURCE**

Setiap reward harus memiliki sumber.

Prioritas:

★★★★★ Official

★★★★ Official Store

★★★ Trusted External

★★ Community

★ Unknown

**28\. VERIFICATION STATUS** *(direvisi v1.1 — model tiga sumbu)*

Penilaian dipisahkan menjadi TIGA sumbu independen (sebelumnya tercampur dalam satu status):

**Sumbu 1 — `verification_status` (kebenaran INFORMASI):**

- **VERIFIED** — bukti cukup & sumber terpercaya (kombinasi sumber resmi + konfirmasi silang; lihat `docs/VALIDATION_RUBRIC.md`).
- **PARTIALLY VERIFIED** — sebagian informasi belum dapat dipastikan.
- **UNVERIFIED** — bukti tidak cukup.

**Sumbu 2 — `risk_level` (keamanan PLATFORM):**

- **RENDAH** — payout track record baik, identitas jelas, tanpa red flags.
- **SEDANG** — ada warning kecil (mis. syarat kurang transparan).
- **TINGGI** — red flags material (payout tidak konsisten, identitas tidak jelas).
- **TERINDIKASI SCAM** — fail kritis (ponzi, payout palsu, identitas palsu) → **diblokir dari rekomendasi**, hanya muncul sebagai peringatan.

Dihitung dari rubrik validasi 8 pemeriksaan + `payout_reports` + laporan komunitas (Appendix A2).

**Sumbu 3 — `offer_status` (siklus hidup OFFER):**

- **ACTIVE** / **EXPIRED** / **SCHEDULED** — status EXPIRED dipindahkan ke sumbu ini (bukan level verifikasi).

Aturan rekomendasi (§29) berlaku pada `verification_status`; platform dengan `risk_level` TERINDIKASI SCAM tidak pernah masuk hasil rekomendasi.

**29\. RECOMMENDATION RULE**

**Unverified tidak boleh masuk Top Recommendations.**

Prioritas:

Verified

↓

Partially Verified

↓

Unverified

Unverified hanya dapat muncul sebagai informasi tambahan dengan peringatan yang jelas.

**30\. REWARD CALCULATION**

CuanRadar menghitung:

- reward per activity;
- estimated daily;
- estimated weekly;
- estimated monthly;
- effective earning/hour bila data memungkinkan.

Jika data tidak cukup:

Jangan membuat asumsi.

Contoh:

Jika diketahui:

Rp5.000/task

tetapi tidak diketahui jumlah task:

Tampilkan:

Rp5.000/task

dan:

Monthly earning cannot be reliably estimated.

**31\. ESTIMATION DISCLAIMER**

Semua angka prediksi harus diberi label:

**Estimated**

Bukan:

Guaranteed.

**32\. RECOMMENDATION SCORE** *(direvisi v1.1 — skema tunggal 6 faktor)*

Baseline (bobot deterministik; versi bobot dicatat sebagai `bobot_version` agar skor historis dapat dijelaskan):

| **Faktor**        | **Bobot** | **Definisi**                                                   |
| ----------------- | --------- | -------------------------------------------------------------- |
| Reward Potential  | 25%       | nilai reward, frekuensi, earning ceiling, tipe reward          |
| Verification      | 20%       | kualitas bukti & sumber informasi offer                        |
| Reward / Effort   | 20%       | nilai efektif per jam — hanya jika data cukup (lihat §30)      |
| Platform Risk     | 15%       | `risk_level` platform (rubrik + payout history + laporan)      |
| Accessibility     | 10%       | kemudahan mulai & metode payout                                |
| Reward Stability  | 10%       | konsistensi dari `reward_history`; app baru = nilai netral      |
| **Total**         | **100%**  |                                                                |

**33\. REWARD POTENTIAL**

Mempertimbangkan:

- nilai reward;
- frequency;
- earning ceiling;
- reward type.

Tidak hanya nominal.

**34\. REWARD / EFFORT**

Reward tinggi + effort rendah:

skor tinggi.

Reward rendah + effort tinggi:

skor rendah.

**35\. REWARD STABILITY**

Menggunakan reward_history.

Contoh:

5%

5%

5%

5%

lebih stabil dibanding:

10%

2%

0%

8%

Aplikasi baru yang belum memiliki history mendapat nilai netral *(v1.1: netral = 50% dari bobot Reward Stability, definisi eksplisit)*.

**36\. CACHE SYSTEM**

Cache key:

country

-

category

-

scan_type

-

filter_hash

Contoh:

ID:shopping:quick:all

**37\. CACHE TTL**

| **Data**        | **TTL**      |
| --------------- | ------------ |
| Normal reward   | 72 jam       |
| Popular reward  | 24 jam       |
| Flash promotion | 6–24 jam     |
| Expired reward  | Immediate    |
| Forced refresh  | Bypass cache |

**38\. DATABASE AS KNOWLEDGE BASE**

Database CuanRadar bukan sekadar storage.

Ia secara bertahap menjadi:

**Reward Opportunity Knowledge Base**

Semakin banyak discovery dan verification dilakukan:

AI Search Dependency

↓

↓

↓

LOWER

Database semakin kaya.

**39\. SCAN CREDIT SYSTEM** *(direvisi v1.2 — kuota harian per plan; lihat `docs/MONETIZATION.md` §3.1)*

Baseline lama (v1.0):

**Free user**

**40 credits/month**

**Quick Scan**

**1 credit**

**Deep Scan**

**5 credits**

Daily limit:

Quick ≤ 3/day

Deep ≤ 1/day

**40\. GLOBAL AI BUDGET** *(direvisi v1.1 — dipecah per komponen)*

Pilot budget baseline (dipecah, bukan satu angka):

| **Komponen** | **Budget**  | **Catatan**                                                          |
| ------------ | ----------- | -------------------------------------------------------------------- |
| LLM (AI)     | US$7/month  | deepseek + model routing hemat (model mahal = last resort)            |
| Search       | US$3/month  | gunakan Tavily `basic` free tier dulu; Serper hanya fallback manual — diverifikasi saat implementasi |
| **Total**    | **US$10/month** | configurable melalui environment/configuration                      |

Pemisahan ini wajib karena search API dihitung per query dan dapat mendominasi budget (lihat §42).

**41\. GLOBAL BUDGET GOVERNOR**

Threshold:

0–70%

NORMAL

70–85%

MORE CACHING

85–95%

LIMIT DEEP SCAN

95–100%

EMERGENCY MODE

100%

NO NEW DEEP SCAN

Quick Scan dari existing database/cache tetap dapat berjalan.

**42\. TARGET AI COST** *(direvisi v1.1 — dipecah per komponen per Deep Scan)*

Target:

**LLM cost / Deep Scan:** Excellent < US$0.003 · Acceptable US$0.003–0.006 · Warning US$0.006 · Red Flag US$0.01

**Search cost / Deep Scan:** Excellent < US$0.002 · Acceptable US$0.002–0.004 · Warning US$0.004 · Red Flag US$0.006

**Total / Deep Scan:** Excellent < US$0.005 · Acceptable US$0.005–0.01 · Warning US$0.01 · Red Flag US$0.03

Ini adalah target internal, bukan biaya yang dijanjikan kepada pengguna.

**43\. COST MONITORING**

Setiap AI scan mencatat:

- search requests;
- AI requests;
- token usage jika tersedia;
- model;
- estimated cost;
- cache hit;
- candidates;
- verification.

Admin nantinya dapat melihat:

Total AI Cost

Cost / Scan

Cost / User

Search Cost

LLM Cost

**44\. RATE LIMITING**

Baseline:

**Per user**

Maximum:

**1 active scan**

dan:

**5 scan requests / 10 menit**

Selain credit limits.

**45\. CONCURRENCY**

Pilot baseline:

**Maximum 5 Deep Scans concurrently.**

Request berikutnya masuk:

QUEUED

atau menggunakan cached data jika tersedia.

**46\. SECURITY MODEL**

Web content dianggap:

**UNTRUSTED INPUT**

AI tidak boleh mengikuti instruksi yang berasal dari halaman web.

Contoh:

Website

↓

untrusted content

↓

extract data only

Bukan:

Website instruction

↓

AI follows instruction

**47\. URL SECURITY**

Prioritas link:

1. Official website
2. Google Play
3. Apple App Store
4. Official marketplace

Hindari:

- APK mirror;
- unknown downloads;
- suspicious redirects;
- shortened URLs yang tidak dapat diverifikasi.

**48\. THIRD-PARTY ACCOUNT SAFETY**

CuanRadar tidak boleh:

- meminta password aplikasi lain;
- menyimpan OTP;
- membaca PIN;
- login otomatis ke wallet;
- membaca saldo;
- melakukan transaksi;
- melakukan withdrawal;
- melakukan earning task otomatis.

**49\. USER EXPERIENCE**

CuanRadar harus terkesan:

- modern;
- sederhana tapi menarik;
- cepat;
- terpercaya;
- tidak berlebihan;
- mobile-first.

Hindari tampilan seperti:

- casino;
- gambling;
- get-rich-quick;
- crypto speculation.

**50\. MAIN NAVIGATION**

Setelah login:

Dashboard

AI Scan

Rewards

Saved

Profile

**51\. DASHBOARD**

Menampilkan:

- greeting;
- Scan Credits;
- Quick Scan;
- Deep Scan;
- recommended opportunities;
- saved apps;
- recent scan.

**52\. AI SCAN SCREEN**

Kontrol:

Scan Type

\[ Quick \] \[ Deep \]

Category

\[ All \]

\[ Entertainment \]

\[ Shopping \]

\[ Wallet — Limited \]

\[ SCAN \]

Tampilkan:

Remaining Scan Credits

**53\. QUICK SCAN UX**

Normal:

Scan

↓

Finding opportunities

↓

Results

Cold Start:

Finding reward opportunities...

↓

Searching

↓

Filtering

↓

Checking

↓

Results

Jangan mengatakan:

"Database kosong."

**54\. COLD START UX**

Pesan:

**Building your first reward scan...**

Subtext:

"We're checking a few current opportunities. This may take a little longer the first time."

Jika selesai:

**7 reward opportunities found**

Jika hanya menemukan 2:

**2 verified opportunities found**

Jangan mengisi hasil secara artificial.

**55\. REWARD CARD**

Minimal:

App

Category

Reward

Activity

Estimated Reward

Effort

Verification

Last Verified

\[Open\]

\[Save\]

**56\. REWARD DETAIL**

Harus menampilkan:

- application information;
- reward;
- conditions;
- minimum withdrawal;
- source;
- verification;
- last verified;
- estimated earning;
- official link.

**57\. WHY RECOMMENDED**

User dapat melihat:

**Why is this recommended?**

Contoh:

✓ Verified reward

✓ Available in Indonesia

✓ Low effort

✓ Good reward/time ratio

**58\. EMPTY STATE**

CuanRadar harus tetap berfungsi ketika database kosong.

Contoh:

**No reward opportunities available yet.**

Tidak boleh crash.

**59\. DATABASE SCHEMA FINAL** *(direvisi v1.1)*

Minimal:

users/profile

reward_apps          — tambah: `risk_level`, `company_identity`, status allowlist

reward_offers        — tambah: `offer_status` (active/expired/scheduled), `currency`, nilai rupiah sebagai integer minor unit (sen IDR)

reward_sources

verification_records

reward_history

payout_reports       — BARU v1.1: bukti reward benar-benar cair (platform, jumlah, tanggal, metode, referensi bukti, status moderasi)

community_reports    — BARU v1.1: telat bayar / ubah syarat / indikasi scam (status moderasi bertingkat)

review_queue_items   — BARU v1.1: hasil extraction menunggu tinjauan sebelum dipublikasikan

scan_history

scan_credits

user_preferences

user_saved_apps

**60\. BACKEND MODULE ARCHITECTURE**

/backend

scan/

├── controller

├── governor

├── cache

└── orchestrator

discovery/

├── search

├── candidate-filter

└── deduplication

extraction/

└── reward-extractor

verification/

├── verifier

└── source-trust

calculation/

├── reward-calculator

└── earning-estimator

scoring/

└── recommendation-score

monitoring/

├── cost

└── usage

Build dapat menggunakan satu backend modular.

**Tidak perlu microservices untuk pilot.**

**61\. API FOUNDATION**

Endpoint utama:

POST /api/scan

GET /api/scan/:id

GET /api/rewards

GET /api/rewards/:id

GET /api/apps

GET /api/apps/:id

GET /api/user/preferences

PATCH /api/user/preferences

GET /api/saved-apps

POST /api/saved-apps

DELETE /api/saved-apps/:id

GET /api/scan-credits

**62\. SCAN STATE MACHINE**

QUEUED

↓

CHECKING_CACHE

↓

DISCOVERING

↓

FILTERING

↓

EXTRACTING

↓

VERIFYING

↓

CALCULATING

↓

RANKING

↓

COMPLETED

Alternative:

CACHE_COMPLETED

LIMITED

FAILED

**63\. AI SCAN RESPONSE**

Struktur hasil harus terstruktur, bukan free-form text.

Contoh:

{

"scan_id": "scan_123",

"status": "completed",

"type": "quick",

"category": "shopping",

"credits_used": 1,

"results": \[

{

"app_id": "app_001",

"rank": 1,

"score": 87,

"verification": "verified",

"risk_level": "low",

"provenance": "database",

"reward": {

"type": "cashback",

"value": 5,

"unit": "percent"

},

"estimated": {

"daily": 10000,

"monthly": 300000

}

}

\]

}

**64\. BUILD SCOPE**

PRD ini akan menjadi baseline untuk development bertahap.

**BUILD 1**

Foundation:

- UI;
- authentication;
- database;
- navigation;
- profile;
- rewards foundation;
- saved apps;
- scan UI;
- credits;
- empty states;
- security;
- provider abstractions.

**BUILD 2**

AI Scan core:

- SearchProvider;
- AIProvider;
- discovery;
- extraction;
- candidate filtering;
- database population;
- Quick Scan Cold Start.

**BUILD 3**

Intelligence:

- verification;
- reward calculation;
- estimation;
- recommendation scoring;
- reward history;
- cache;
- Budget Governor;
- cost tracking.

**BUILD 4**

Testing & refinement:

- reliability;
- edge cases;
- security;
- performance;
- UX refinement;
- AI prompt optimization.

**BUILD 5**

Production readiness:

- final security audit;
- monitoring;
- deployment;
- analytics;
- operational controls;
- cost optimization.

**Build berikutnya tidak boleh mengubah fundamental PRD ini tanpa keputusan eksplisit.**

**65\. FITUR YANG SENGAJA TIDAK MASUK PILOT**

Untuk menjaga biaya dan kompleksitas rendah:

- automated earning;
- automated referral;
- third-party account integration;
- payment system;
- wallet transaction;
- financial account integration;
- automated browsing agent;
- unlimited AI search;
- native mobile app;
- social network;
- user-to-user marketplace;
- advanced personalization;
- complex subscription system;
- multi-country support;
- multilingual expansion.

**66\. SUCCESS CRITERIA PILOT**

Pilot bukan diukur dari jumlah fitur.

Yang ingin divalidasi:

**A. Discovery Value**

Apakah pengguna menemukan reward yang sebelumnya tidak mereka ketahui?

**B. Recommendation Value**

Apakah ranking CuanRadar membantu pengguna memilih?

**C. Trust**

Apakah user percaya pada informasi reward?

**D. Engagement**

Apakah pengguna kembali melakukan Scan?

**E. Cost**

Apakah AI cost tetap rendah?

**F. Retention**

Apakah pengguna kembali menggunakan CuanRadar setelah penggunaan pertama?

**67\. KPI AWAL**

Kita dapat menggunakan KPI sederhana:

| **KPI**                | **Tujuan**                    |
| ---------------------- | ----------------------------- |
| Scan completion rate   | \>90%                         |
| Successful Quick Scan  | \>95%                         |
| AI Scan error rate     | <5%                           |
| Average Deep Scan cost | ≤\$0.01                       |
| Cache hit rate         | meningkat dari waktu ke waktu |
| Saved-app rate         | diukur                        |
| Repeat Scan rate       | diukur                        |
| Reward click-through   | diukur                        |
| User retention         | diukur                        |
| False-positive verifikasi (offer ternyata EXPIRED ≤30 hari setelah diverifikasi) | <10%  |
| False-negative scam (platform lolos filter, terindikasi scam kemudian) | <1% |
| Payout issues per 1.000 klaim | diukur |

Angka tersebut adalah **target awal untuk evaluasi**, bukan klaim performa yang sudah terbukti.

**68\. PRINCIPLE OF TRUST**

CuanRadar harus selalu memilih:

**akurasi > jumlah hasil**

dan:

**transparansi > klaim besar**

serta:

**data yang dapat diverifikasi > AI-generated assumption**

**69\. PRINCIPLE OF COST**

Urutan prioritas:

Existing Database

↓

Fresh Cache

↓

Light Processing

↓

Cheap AI

↓

Search

↓

Expensive AI

AI mahal adalah **last resort**, bukan default.

**70\. PRINCIPLE OF SCALABILITY**

CuanRadar tidak perlu menggunakan arsitektur enterprise pada tahap pilot.

Mulai dengan:

React(Vite)/Tanstack/Next.js (pilih yang paling cocok dan lebih stabil)

-

Supabase

-

deepseek

-

Search Provider

-

Cloudflare

dengan abstraction layer yang memungkinkan penggantian provider.

Jika user bertambah, baru pertimbangkan:

AI Router

Caching Layer

Queue

Dedicated Search Provider

Background Workers

Advanced Analytics

**71\. PRODUCT ARCHITECTURE**

| **Layer**         | **Teknologi**                      |
| ----------------- | ---------------------------------- |
| Frontend          | **React**                          |
| Build             | **Vite/tanstack**                           |
| Language          | **TypeScript**                     |
| UI                | **Tailwind CSS**                   |
| Frontend Hosting  | **Cloudflare Pages/Workers**       |
| CDN               | **Cloudflare**                     |
| DNS               | **Cloudflare**                     |
| WAF               | **Cloudflare**                     |
| DDoS              | **Cloudflare**                     |
| Rate Limiting     | **Cloudflare + application layer** |
| Backend           | **Supabase**                       |
| Database          | **Supabase PostgreSQL**            |
| Authentication    | **Supabase Auth**                  |
| Backend Functions | **Supabase Edge Functions**        |
| AI                | **deepseek initially**               |
| Search            | **Search Provider abstraction**    |
| Source Control    | **GitHub**                         |
| Monitoring        | **Cloudflare + Supabase**          |
|                   |                                    |

CuanRadar

│

┌────────────────────┴────────────────────┐

│ │

FRONTEND BACKEND

│ │

React + Vite/Tanstack + TypeScript Supabase

│ │

│ ┌───────────┼───────────┐

│ │ │ │

│ Auth PostgreSQL Edge Functions

│ │ │ │

│ │ │ │

│ │ │ Scan Controller

│ │ │ │

│ │ │ Budget Governor

│ │ │ │

│ │ │ AI Orchestrator

│ │ │ │

│ │ │ Search Orchestrator

│ │ │

│ │ │

│ │ Reward Database

│ │ │

│ │ Cache / Scan Data

│ │

└──────────────────────────────┴───────────┘

│

▼

CLOUDFLARE

│

┌─────────────┼─────────────┐

│ │ │

DNS/CDN WAF/Security Edge/Proxy

│

▼

React + Vite Application

**72\. FINAL PRODUCT PRINCIPLE**

Seluruh CuanRadar v1 dapat diringkas dalam satu kalimat:

**CuanRadar menggunakan AI untuk menemukan dan memahami peluang reward, aturan deterministik, cache, dan sumber yang dapat diverifikasi untuk menjaga hasil tetap murah, konsisten, dan dapat dipercaya.**

---

# APPENDIX v1.1 — KOREKSI KONSEPTUAL & FITUR BARU

Berisi penjabaran koreksi dari Revision Log. Referensi: `docs/VALIDATION_RUBRIC.md`, `docs/ARCHITECTURE.md`, `docs/MONETIZATION.md`, `docs/RISKS.md`.

## A1. Model Tiga Sumbu (Koreksi A)

- `verification_status` = apakah INFORMASI bisa dipercaya (VERIFIED / PARTIALLY VERIFIED / UNVERIFIED).
- `risk_level` = apakah PLATFORM aman (RENDAH / SEDANG / TINGGI / TERINDIKASI SCAM).
- `offer_status` = siklus hidup offer (ACTIVE / EXPIRED / SCHEDULED).

Kedua sumbu pertama muncul bersama di halaman detail dan di badge Reward Card: **badge informasi** (verifikasi) dan **badge risiko** (platform) ditampilkan terpisah agar pengguna tidak bingung antara "datanya benar" dan "platformnya aman".

## A2. Bukti Payout & Laporan Komunitas (Koreksi B)

- `payout_reports`: pengguna/komunitas melaporkan reward yang benar-benar cair (platform, jumlah, tanggal, metode, referensi bukti). Laporan terverifikasi memberi bobot pada Reward Stability, Platform Risk, dan Verification.
- `community_reports`: telat bayar, ubah syarat, indikasi scam.
- Alur moderasi bertingkat: laporan masuk → konfirmasi ≥2 pengguna independen → tinjauan editor → status terverifikasi/ditolak. Anti-spam: rate limit, verifikasi akun, sistem reputasi.

## A3. Pre-seed & Eksekusi Scan via Queue (Koreksi D)

- **Pre-seed (F0):** katalog 20–30 platform diisi kurasi manual SEBELUM launch, sehingga Quick Scan hampir selalu hit database/cache dan cold start (§12) jarang terpicu.
- **Eksekusi async:** `POST /api/scan` hanya menerima & meng-enqueue; pekerjaan discovery/extraction/verification berjalan di **background job (queue)**; klien memantau via `GET /api/scan/:id`. Edge function tidak mengeksekusi scan panjang (batas waktu eksekusi).
- Discovery Lock TTL: Quick 60 detik, Deep 10 menit, dengan lease (lihat §16).

## A4. Kalkulator dengan Asumsi Pengguna (Koreksi G1)

- Jika data cukup: hitung otomatis (cuan/jam, per hari/minggu/bulan) — kode deterministik, bukan LLM.
- Jika data tidak cukup: tampilkan nilai satuan (mis. Rp5.000/task) + label "Monthly earning cannot be reliably estimated".
- Opsi lanjutan: pengguna boleh memasukkan asumsi sendiri (mis. menit per task, jumlah task/hari); hasil diberi label **"berdasarkan asumsi Anda"** dan tidak pernah ditampilkan sebagai angka resmi.

## A5. Fitur Compare (Koreksi G2)

- Pilih 2–4 offer → tampilan side-by-side (reward, effort, skor, risiko, metode payout, syarat).
- Masuk ke navigasi utama (menambah nav §50: Dashboard, AI Scan, Rewards, **Compare**, Saved, Profile).

## A6. Review Queue — Kurasi Manusia Sebelum Publish (Koreksi H1)

Alur publikasi data hasil discovery:

```
Extraction (AI) → rules otomatis (skema, threshold, dedup) → REVIEW QUEUE → editor → publish
                                                              └─ gagal/mencurigakan → discard/flag
```

- Hanya data yang lolos review yang boleh berstatus selain UNVERIFIED dan muncul di Top Recommendations.
- Kurasi manual tetap menjadi sumber kebenaran utama; hasil otomasi adalah kandidat, bukan fakta final.

## A7. Kebijakan Afiliasi & Monetisasi (Koreksi H2)

- Semua tautan referral **wajib berlabel "tautan afiliasi"**; tidak ada link tersembunyi.
- **Tidak ada pay-for-rank**: peringkat/skor tidak dapat dibeli; konten partner diberi label.
- Skema pendapatan bertahap (detail: `docs/MONETIZATION.md`): F1 tanpa iklan + afiliasi berlabel opsional → F2 iklan native + afiliasi → F3 premium + B2B.
- Credit system (§39) adalah **cost-control**, bukan sumber pendapatan.

## A8. Kebijakan Konten & Legal (Koreksi I)

- **Dilarang masuk katalog:** platform investasi/staking/mining yang menjanjikan return, pinjaman/payday predator, dan konten gambling.
- Disclaimer permanen: CuanRadar **bukan nasihat keuangan/investasi**; semua angka adalah estimasi berlabel.
- Kepatuhan UU PDP: minimalkan data pribadi; tidak menyimpan PIN/OTP/saldo/data payout sensitif.
- Review legal sebelum Build 1 (auth) dan sebelum konten menyentuh instrumen keuangan (checklist: `docs/RISKS.md`).

## A9. Provenance di UI & Re-verifikasi Terjadwal (Koreksi K)

- Setiap hasil menampilkan provenance: "dari database terverifikasi" / "dari cache" / "hasil pencarian baru — menunggu review".
- Jangan menjual label "AI" berlebihan: nama fitur tetap "Scan"; "AI" adalah detail teknis internal.
- **Scheduled job harian:** menandai offer EXPIRED berdasarkan `validity` + re-check otomatis halaman promo publik, sehingga cache TTL (§37) tidak mengandalkan user scan semata.
