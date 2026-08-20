# 09_SPRINT_BACKLOG.md

# 📱 Lemburin — Sprint Backlog & Roadmap Penyempurnaan

> **Dokumen Perencanaan Sprint & Penyempurnaan Fitur Lapangan (Real-World Worker Needs)**

---

## 🎯 Ringkasan Tujuan Sprint

Sprint ini dirancang untuk menyempurnakan aplikasi **Lemburin** dari sekadar kalkulator dasar menjadi **Personal Overtime Tracker yang akurat sesuai hukum ketenagakerjaan Indonesia (PP 35/2021) dan siap pakai di lapangan**.

---

## 📅 Roadmap Sprint

```text
┌──────────────────────────────────────┐
│ SPRINT 1: Akurasi & Integritas Data  │ ──► is_holiday, Skema 5 vs 6 Hari Kerja, Sinkronisasi DB
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ SPRINT 2: Produktivitas Lapangan      │ ──► Quick Share WhatsApp, Auto-Rollover Periode, Warning K3
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ SPRINT 3: Bukti Fisik & Insentif      │ ──► Lampiran SPL & Slip Gaji, Uang Makan/Transport Lembur
└──────────────────────────────────────┘
```

---

## 🚀 SPRINT 1 — Core Accuracy & Data Integrity (Prioritas: Kritis)

### 📌 SP-01: Integrasi Kolom `is_holiday` pada Database & State
* **Problem**: Input UI memiliki toggle hari libur, namun belum tersimpan di database `overtime_entries`. Setelah reload, tarif kembali ke hari kerja biasa.
* **Solusi**:
  1. Tambahkan kolom `is_holiday: boolean` pada tabel `overtime_entries`.
  2. Perbarui model `types/database.ts` dan schema insert/update Supabase.
  3. Pastikan `is_holiday` diload dan dihitung pada seluruh rekap.
* **Migration SQL**:
  ```sql
  ALTER TABLE public.overtime_entries 
  ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN NOT NULL DEFAULT FALSE;
  ```
* **Acceptance Criteria**:
  - [x] Data lembur hari libur tersimpan permanen di Supabase dengan `is_holiday = true`.
  - [x] Saat dibuka kembali di layar edit, toggle `isHoliday` tetap aktif.
  - [x] Kalkulasi di Dashboard & Ringkasan Bulanan merefleksikan pengali tarif libur.

---

### 📌 SP-02: Formula PP 35/2021 untuk Sistem 5 Hari vs 6 Hari Kerja
* **Problem**: Pengali tarif hari libur berbeda antara pekerja kantor (5 hari kerja) dan pekerja pabrik/shift (6 hari kerja).
* **Solusi**:
  1. Tambahkan opsi `work_system: '5_days' | '6_days'` di profil perusahaan / employment.
  2. Perbarui logika `src/utils/calculator.ts`:
     - **5 Hari Kerja**: Jam 1-8 (2x), Jam 9 (3x), Jam 10-12 (4x).
     - **6 Hari Kerja**: Jam 1-7 (2x), Jam 8 (3x), Jam 9-10 (4x).
* **Migration SQL**:
  ```sql
  ALTER TABLE public.employments 
  ADD COLUMN IF NOT EXISTS work_system VARCHAR(20) NOT NULL DEFAULT '5_days';
  ```
* **Acceptance Criteria**:
  - [x] Pengguna dapat memilih 5 Hari Kerja atau 6 Hari Kerja di form Profil Perusahaan.
  - [x] Nilai estimasi lembur hari libur terhitung presisi sesuai pilihan sistem kerja.

---

### 📌 SP-03: Sinkronisasi Total Upah Periode secara Menyeluruh
* **Solusi**:
  - Dashboard, Kalender, History, dan Monthly Summary menghitung total menggunakan parameter `is_holiday` yang aktual dari setiap entri.
* **Acceptance Criteria**:
  - [x] Nilai di Dashboard Hero Card, Ringkasan Bulanan, dan Detail Lembur 100% konsisten.

---

## 💬 SPRINT 2 — Productivity & Field Utilities (Prioritas: Tinggi)

### 📌 SP-04: Fitur "Salin / Bagikan ke WhatsApp" (Quick WA Share)
* **Kebutuhan Lapangan**: Pekerja sering diminta mengirimkan rekap jam lembur ke supervisor atau admin HR via pesan WhatsApp.
* **Solusi**:
  - Tambahkan tombol **"Bagikan ke WhatsApp"** di halaman `summary/[periodId].tsx`.
  - Mengenerate teks rapi lengkap dengan nama, periode, total jam, estimasi upah, dan rincian per tanggal.
  - Menggunakan deep linking `Linking.openURL('whatsapp://send?text=...')`.
* **Acceptance Criteria**:
  - [x] Tombol WA Share membuka aplikasi WhatsApp dengan pesan terformat rapi.
  - [x] Disediakan juga opsi "Salin ke Clipboard" jika WhatsApp tidak terpasang.

---

### 📌 SP-05: Auto-Rollover & Switcher Periode Gaji Berjalan
* **Problem**: Pengguna harus manual mengganti tanggal ketika siklus gaji bulan lalu berakhir.
* **Solusi**:
  - Ketika tanggal hari ini melewati `end_date` periode aktif, tampilkan banner pintar: *"Periode baru telah dimulai. Buat periode [Bulan Tahun]?"*.
  - Tombol satu klik untuk men-generate pay period baru berdasarkan template cutoff sebelumnya.
* **Acceptance Criteria**:
  - [x] Aplikasi otomatis mendeteksi periode kadaluarsa dan menawarkan pembuatan periode baru.
  - [x] Riwayat periode lama tetap tersimpan dan terkunci (*locked*).

---

### 📌 SP-06: Indikator Peringatan Batas Lembur K3 (PP 35/2021)
* **Kebutuhan**: Regulasi membatasi lembur hari kerja maksimal 4 jam/hari dan 18 jam/minggu untuk menjaga kesehatan pekerja.
* **Solusi**:
  - Tampilkan badge peringatan visual jika total lembur minggu berjalan mencapai ≥ 18 jam.
  - Edukasi pekerja tentang hak kesehatan kerja mereka.
* **Acceptance Criteria**:
  - [x] Badge peringatan muncul di dashboard ketika akumulasi lembur mingguan mendekati 18 jam.

---

## 📸 SPRINT 3 — Evidence & Verification Enhancements (Prioritas: Sedang)

### 📌 SP-07: Lampiran Foto Bukti SPL & Absensi
* **Solusi**:
  - Pengguna dapat melampirkan foto Surat Perintah Lembur (SPL) atau bukti barcode absensi mesin pada setiap entri lembur.
  - Foto diunggah ke Supabase Storage bucket `overtime_attachments`.
* **Migration SQL**:
  ```sql
  ALTER TABLE public.overtime_entries 
  ADD COLUMN IF NOT EXISTS attachment_url TEXT NULL;
  ```

---

### 📌 SP-08: Lampiran Foto Slip Gaji Fisik pada Verifikasi Gaji
* **Solusi**:
  - Pengguna dapat memotret slip gaji asli mereka pada halaman `verification/[periodId].tsx`.
  - Tampilan visual split-view memudahkan pengecekan angka di slip fisik dengan angka di aplikasi.
* **Migration SQL**:
  ```sql
  ALTER TABLE public.salary_verifications 
  ADD COLUMN IF NOT EXISTS slip_photo_url TEXT NULL;
  ```

---

### 📌 SP-09: Komponen Insentif Lembur Harian (Uang Makan & Transport)
* **Solusi**:
  - Pengaturan nominal uang makan & uang transport per kehadiran lembur di `company/setup.tsx`.
  - Otomatis ditambahkan ke total pendapatan lembur per sesi.

---

---

## 🏛️ SPRINT 4 — Super Payroll, Tax & Compliance (Prioritas: Tinggi)

### 📌 SP-10: Auto-Detect Hari Libur Nasional Indonesia (SKB 3 Menteri)
* **Solusi**:
  - Modul `src/utils/holidays.ts` memuat kalender resmi hari libur nasional & cuti bersama Indonesia.
  - Form pencatatan lembur otomatis mengidentifikasi tanggal merah dan menerapkan formula lembur hari libur (2x–4x) tanpa input manual.
  - Kalender menampilkan indikator dan badge nama libur resmi.

### 📌 SP-11: Kalkulator Pajak PPh 21 TER 2024 & Iuran BPJS Karyawan
* **Solusi**:
  - Mengimplementasikan Skema TER PP 58/2023 & PMK 168/2023 (Kategori A, B, C berdasarkan status PTKP).
  - Menghitung iuran resmi karyawan: BPJS JHT (2%), BPJS Jaminan Pensiun (1%), dan BPJS Kesehatan (1%).
  - Menampilkan simulasi **Take-Home Pay (Gaji Bersih Diterima)** pada ringkasan bulanan.

### 📌 SP-12: Generator Surat Klaim Selisih Lembur (Dispute Resolver PDF)
* **Solusi**:
  - Ketika slip gaji fisik kantor terdapat selisih kurang bayar (`difference < 0`), aplikasi menyediakan tombol ekspor surat formal PDF berlandaskan **Pasal 31 PP No. 35 Tahun 2021** yang siap diajukan ke HRD/Payroll.

---

## 📊 Matriks Pelaksanaan Sprint

| ID | Fitur | Sprint | Status | Target File |
| :--- | :--- | :---: | :---: | :--- |
| **SP-01** | Kolom `is_holiday` & sinkronisasi DB | Sprint 1 | ✅ Completed | `types/database.ts`, `overtime/add.tsx`, `edit/[id].tsx`, `summary/[periodId].tsx` |
| **SP-02** | Formula 5 vs 6 Hari Kerja (PP 35/2021) | Sprint 1 | ✅ Completed | `utils/calculator.ts`, `company/setup.tsx` |
| **SP-03** | Rekap Upah Konsisten | Sprint 1 | ✅ Completed | `(tabs)/index.tsx`, `summary/[periodId].tsx`, `yearly.tsx` |
| **SP-04** | Quick Share WhatsApp & Salin Rekap | Sprint 2 | ✅ Completed | `summary/[periodId].tsx`, `utils/formatting.ts` |
| **SP-05** | Auto-Rollover Periode Gaji | Sprint 2 | ✅ Completed | `(tabs)/index.tsx`, `pay-period/setup.tsx` |
| **SP-06** | Warning Batas Lembur K3 (18j/minggu) | Sprint 2 | ✅ Completed | `(tabs)/index.tsx` |
| **SP-07** | Lampiran Foto SPL / Absensi | Sprint 3 | ✅ Completed | `overtime/add.tsx`, `overtime/[id].tsx`, `upload.ts` |
| **SP-08** | Foto Slip Gaji pada Verifikasi | Sprint 3 | ✅ Completed | `verification/[periodId].tsx`, `upload.ts` |
| **SP-09** | Uang Makan & Transport Lembur | Sprint 3 | ✅ Completed | `company/setup.tsx`, `utils/calculator.ts` |
| **SP-10** | Auto-Detect Hari Libur Nasional SKB 3 Menteri | Sprint 4 | ✅ Completed | `utils/holidays.ts`, `overtime/add.tsx`, `calendar.tsx` |
| **SP-11** | Kalkulator PPh 21 TER 2024 & BPJS (Take-Home Pay) | Sprint 4 | ✅ Completed | `utils/tax.ts`, `utils/bpjs.ts`, `summary/[periodId].tsx` |
| **SP-12** | Surat Klaim Selisih Lembur PP 35/2021 (PDF) | Sprint 4 | ✅ Completed | `verification/[periodId].tsx` |
