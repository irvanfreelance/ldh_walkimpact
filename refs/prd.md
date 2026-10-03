# PRD — Walk Impact 2026
## Public Website & Ticketing Platform

**Version:** 1.0  
**Status:** Ready for Development  
**Owner:** LAZ Darul Hikam  
**Last Updated:** 2026-10

---

## 1. Overview

Walk Impact 2026 adalah platform web publik untuk event jalan santai sosial yang diselenggarakan LAZ Darul Hikam pada 7 November 2026 di Bandung. Platform ini mencakup landing page informatif dan sistem pendaftaran tiket end-to-end dengan pembayaran Midtrans.

### 1.1 Goals

- Mendorong 750 peserta mendaftar sebelum 23 Oktober 2026
- Menyampaikan narasi dampak sosial sebelum konversi
- Proses registrasi tanpa hambatan dari landing hingga konfirmasi
- Memberikan kepercayaan melalui transparansi kuota dan info event

### 1.2 Non-Goals

- Portal sponsor / kemitraan (tidak ada di versi ini)
- Dashboard donatur
- Sistem CMS publik (admin CMS terpisah, internal only)
- Aplikasi mobile native

---

## 2. User Stories

### Pengunjung Umum
- Sebagai pengunjung, saya ingin melihat ringkasan event dengan jelas agar saya tahu apakah saya tertarik ikut
- Sebagai pengunjung, saya ingin melihat countdown ke hari-H agar ada urgensi
- Sebagai pengunjung, saya ingin tahu dampak nyata tiket saya (1 tiket = 1 paket sembako)
- Sebagai pengunjung, saya ingin berbagi halaman ke WhatsApp / Instagram Story

### Calon Peserta
- Sebagai calon peserta, saya ingin mendaftar dalam waktu singkat tanpa banyak field
- Sebagai calon peserta, saya ingin tahu sisa kuota sebelum saya mendaftar
- Sebagai calon peserta, saya ingin melihat ringkasan pesanan sebelum bayar
- Sebagai calon peserta, saya ingin memilih metode pembayaran (bank transfer, QRIS, e-wallet)
- Sebagai calon peserta, saya ingin mendapatkan nomor pendaftaran yang bisa disimpan
- Sebagai calon peserta, saya ingin tahu langkah selanjutnya setelah berhasil daftar

### Admin Internal
- Sebagai admin, saya ingin mengubah teks, FAQ, rundown tanpa deploy ulang
- Sebagai admin, saya ingin memonitor jumlah pendaftar real-time
- Sebagai admin, saya ingin mengekspor data peserta ke Excel
- Sebagai admin, saya ingin melihat status pembayaran tiap peserta

---

## 3. Pages & Features

### 3.1 Landing Page `/`

#### Navbar
- Logo Walk Impact 2026 (kiri)
- Logo mitra: LAZ Darul Hikam, Pasar Modern Batununggal Indah, Batununggal Indah Club (kanan)
- Nav links: Beranda · Tentang · Rundown · Dampak · FAQ
- CTA sticky: **Daftar Sekarang** (pill button, Impact Green)
- Mobile: hamburger menu, CTA tetap visible

#### Hero Section
- Headline: **WALK TOGETHER. CREATE IMPACT.**
- Subheadline: 7 kilometer. 750 peserta. 1.000 paket sembako.
- Info bar: tanggal, jam, lokasi (icon-based)
- CTA: **Daftar Sekarang →**
- Countdown timer: Hari / Jam / Menit / Detik menuju 7 Nov 2026
- Background: ilustrasi peserta berjalan + overlay hijau gradien
- Dot pattern dekoratif

**States countdown:**
- Sebelum registration open → countdown ke tanggal buka daftar
- Saat registration open → countdown ke Event Day
- Setelah event → hidden / ganti dengan recap

#### Impact Section `#dampak`
- Label: "DAMPAK NYATA UNTUK BANDUNG"
- Judul: Langkah Kecil, Dampak Besar
- 3 stat cards: **7 KM** / **1.000 Paket Sembako** / **3.000 Jiwa**
- Masing-masing dengan icon dan deskripsi singkat
- Data dari CMS (`event_stats`)

#### Concept Section `#tentang`
- Label: "TIGA KONSEP UTAMA"
- Judul: Lebih dari Sekadar Jalan Sehat
- 3 cards: Sehat Bersama · Berdampak Nyata · Komunitas Lebih Kuat
- Data dari CMS (`event_concepts`)

#### Rundown Section `#rundown`
- Label: "RUNDOWN ACARA"
- Judul: Rangkaian Kegiatan
- Timeline horizontal (desktop) / vertikal (mobile)
- Steps dengan icon, waktu, dan label
- Data dari CMS (`event_rundowns`)

```
06.00–06.30  Registrasi Peserta
06.30–07.00  Pemanasan Bersama
07.00–09.00  Walk Impact 7KM
09.00–11.00  Panggung Komunitas dan Hiburan
11.00–12.00  Penyerahan Paket Sembako
```

#### Audience Section
- Label: "UNTUK SIAPA?"
- Judul: Semua Bisa Ikut Berjalan
- Grid ilustrasi + label: Keluarga · Komunitas · Pelajar & Mahasiswa · Pekerja · Masyarakat Umum

#### Quota + CTA Section
- Label: "Kuota Peserta"
- Progress bar: `630 dari 750 tempat terisi`
- Persentase angka
- Subtext: "Jadilah bagian dari dampak untuk Bandung!"
- CTA: **Daftar Sekarang →**
- Data real-time dari Redis cache, refresh tiap 60 detik
- State penuh: "Pendaftaran Sudah Ditutup" (disable CTA, ganti warna bar ke merah)

#### About LAZ Section
- Logo LAZ Darul Hikam
- Heading: Bekerja Sama dengan LAZ Darul Hikam
- Deskripsi singkat lembaga
- 3 trust badge: Amanah Terpercaya · Berpengalaman di Bidang Sosial · Memberdayakan Masyarakat

#### FAQ Section `#faq`
- Judul: Pertanyaan Umum / FAQ
- Accordion per item
- Link "Lihat semua pertanyaan →" (expand semua atau halaman terpisah)
- Data dari CMS (`event_faqs`)
- Default tampilkan 4, rest hidden

#### Footer
- Logo Walk Impact + LAZ Darul Hikam
- Nav links: Beranda · Tentang · Rundown · Dampak · FAQ
- Mitra logos
- Social: Instagram · YouTube · Facebook
- Tagline: Langkah Kita untuk Bandung yang Lebih Baik.
- Copyright: © 2026 Walk Impact. Bandung, Indonesia.

---

### 3.2 Registration Page `/daftar`

#### Page Header
- Breadcrumb / back: ← Kembali ke Beranda
- Logo kiri + Logo LAZ kanan

#### Step Indicator (3 steps)
```
[1] Data Peserta → [2] Ringkasan → [3] Konfirmasi
```
- Active step: filled green circle + bold label
- Completed step: checkmark circle
- Future step: gray outline circle

#### Step 1 — Data Peserta

**Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| Nama Lengkap | text | ✓ | min 3, max 255 |
| Nomor WhatsApp | tel | ✓ | format 08xx / +628xx, 10–15 digit |
| Kategori Peserta | select | ✓ | dari `participant_categories` |
| Jumlah Tiket | counter (+/-) | ✓ | min 1, max 5 per transaksi |
| Ukuran Kaos | toggle chips | ✓ | S / M / L / XL / XXL (per tiket jika qty > 1, atau satu pilihan untuk semua) |
| Nama Komunitas/Instansi | text | ✗ | max 255 |

**Aturan Ukuran Kaos:**
- Jika qty = 1 → satu selector ukuran
- Jika qty > 1 → muncul selector per peserta (dinamis)

**CTA:** Lanjut ke Ringkasan →

#### Sidebar Kanan (sticky, desktop) / Card bawah form (mobile)

- Banner event: Walk Impact 2026 (gambar + warna hijau)
- Ringkasan Pendaftaran:
  - Tanggal: Sabtu, 7 November 2026 · 06.00 WIB – Selesai
  - Lokasi: Pasar Modern Batununggal Indah, Bandung
- Highlight: "1 tiket = 1 paket sembako" (amber background)
- Kuota progress bar (630/750, 84%)
- Deadline warning: "Pendaftaran ditutup 23 Oktober 2026" (red badge)
- WhatsApp help: Butuh bantuan pendaftaran? → (link WA)

#### Step 2 — Ringkasan

- Review semua data yang diisi
- Breakdown harga per tiket × qty = total
- Pilih metode pembayaran (Midtrans payment options):
  - Transfer Bank (BCA / BNI / BRI / Mandiri)
  - QRIS
  - GoPay / OVO / ShopeePay
- CTA: **Bayar Sekarang →** → redirect ke Midtrans Snap / redirect
- Back: kembali ke Step 1 tanpa reset data

#### Step 3 — Konfirmasi (setelah payment success)

Redirect dari Midtrans ke `/konfirmasi?order_id=WI-2026-xxxx`

---

### 3.3 Confirmation Page `/konfirmasi`

#### Hero Konfirmasi
- Green checkmark icon (animated entrance)
- Headline: **Kamu Sudah Jadi Bagian dari Dampak.**
- Subheadline: Terima kasih, [Nama]! Pendaftaranmu berhasil kami terima.
- Background: ilustrasi runner + daun hijau

#### Nomor Pendaftaran
- Large display: `WI-2026-0842`
- Copy button (clipboard)
- Tombol: **Simpan Tiket** (download PDF / screenshot-ready card)

#### Summary Cards (2 kolom desktop / stacked mobile)
- **Ringkasan Peserta:** Nama · Jumlah tiket · Kategori · Ukuran kaos
- **Detail Acara:** Tanggal · Jam kumpul (05.30 WIB) · Lokasi

#### Next Steps (4 langkah)
```
1. Simpan nomor pendaftaranmu
   Gunakan nomor ini untuk semua komunikasi terkait acara.

2. Pantau WhatsApp untuk instruksi lanjutan
   Kami akan mengirim informasi penting melalui WhatsApp.

3. Ambil perlengkapan pada 2–3 November 2026
   Di lokasi yang akan diumumkan kemudian.

4. Datang pukul 05.30 di hari-H
   Bersama kita berjalan untuk dampak yang lebih besar!
```

#### Highlight Impact
- Amber card: **1 tiketmu = 1 paket sembako**
- Subtext: Langkahmu membantu saudara-saudara yang membutuhkan melalui program sosial LAZ Darul Hikam.

#### CTAs
- **Bagikan ke WhatsApp →** (pre-filled message dengan nomor daftar)
- Kembali ke Beranda

---

### 3.4 Admin Panel `/admin` (Internal)

> Akses restricted, tidak terindeks search engine.

**Fitur:**
- Dashboard: total pendaftar, total paid, total revenue, sisa kuota
- Tabel peserta: filter by status, kategori, tanggal
- Export Excel (xlsx) semua peserta
- Manajemen konten CMS: FAQ, Rundown, Stats, Concepts
- Detail registrasi per peserta + status pembayaran
- Resend WhatsApp notification (manual trigger)

---

## 4. Functional Requirements

### F-01: Quota Management
- Kuota max 750 peserta (dari `events.max_quota`)
- Quota dihitung dari `registrations` dengan status `paid`
- Cached di Redis, TTL 60 detik
- Jika kuota habis: form disabled, CTA berubah teks, badge "Penuh"
- Race condition handled: cek quota atomik saat submit registrasi

### F-02: Registration Number Generation
- Format: `WI-{YEAR}-{4-digit sequential}`
- Contoh: `WI-2026-0001`, `WI-2026-0842`
- Generated server-side, atomic, tidak duplikat
- Disimpan di `registrations.registration_number`

### F-03: Payment — Midtrans Integration
- Gunakan Midtrans Snap (redirect / embedded)
- `order_id` = registration_number
- Setelah payment: Midtrans redirect ke `/konfirmasi?order_id=WI-2026-xxxx`
- Webhook `/api/payments/notification` untuk update status otomatis
- Verifikasi signature key pada setiap webhook
- Timeout pembayaran: 24 jam (Midtrans default)
- Jika expire: status registrasi jadi `expired`, kuota dikembalikan

### F-04: Ticket PDF Generation
- Setelah konfirmasi, peserta bisa download tiket PDF
- Konten: nomor pendaftaran, nama, event details, QR code (dari nomor pendaftaran)
- Generated on-demand via `/api/registrations/[id]/ticket`

### F-05: WhatsApp Notification
- Setelah pembayaran sukses: kirim konfirmasi via WhatsApp API (atau link pre-filled)
- Konten: nomor daftar, nama event, tanggal, instruksi ambil perlengkapan
- Triggered dari payment webhook settlement

### F-06: Registration Period Guard
- Sebelum `registration_opens_at`: form tidak aktif, hero countdown ke tanggal buka
- Setelah `registration_closes_at`: form ditutup, pesan "Pendaftaran telah ditutup"
- Semua guard dicek di server-side (tidak hanya client)

### F-07: Share to WhatsApp
- Pre-filled text: "Aku baru daftar Walk Impact 2026! 🏃 Yuk ikut bareng, jalan bersama untuk dampak nyata di Bandung. Daftar di: https://walkimpact.id #WalkImpact2026"
- wa.me link dengan encoded text

### F-08: Data Export Admin
- Export semua data peserta: nama, WA, kategori, qty, ukuran kaos, komunitas, status bayar, waktu daftar
- Format: .xlsx
- Filter: by status, kategori, tanggal range

---

## 5. Non-Functional Requirements

| Kategori | Target |
|---|---|
| Page Load (LCP) | < 2.5 detik (mobile 4G) |
| Time to Interactive | < 3.5 detik |
| Lighthouse Score | > 90 (Performance, Accessibility, SEO) |
| Uptime | 99.9% |
| Concurrent Users | 500 simultaneous tanpa degradasi |
| Payment Success Rate | Midtrans SLA |
| Mobile UX | Full feature parity dengan desktop |

---

## 6. Page States Summary

| Kondisi | Landing CTA | Form Status |
|---|---|---|
| Sebelum 1 Okt 2026 | "Segera Hadir" (disabled) | Hidden |
| 1–23 Okt 2026 (normal) | "Daftar Sekarang" (active) | Open |
| Kuota < 10% sisa | "Daftar Sekarang – Hampir Penuh!" | Open + urgency badge |
| Kuota penuh | "Kuota Penuh" (disabled) | Closed |
| Setelah 23 Okt 2026 | "Pendaftaran Ditutup" (disabled) | Closed |
| Setelah 7 Nov 2026 | Berubah ke halaman recap | Closed |

---

## 7. SEO & Meta

- Title: `Walk Impact 2026 — Jalan Bersama, Ciptakan Dampak | LAZ Darul Hikam`
- Description: Event jalan santai sosial 7 KM di Bandung. 750 peserta, 1.000 paket sembako untuk keluarga pra-sejahtera. Daftar sekarang!
- OG Image: 1200×630 hero image dengan branding
- Canonical URL: `https://walkimpact.id`
- robots.txt: allow public, disallow `/admin`
- sitemap.xml: auto-generated
