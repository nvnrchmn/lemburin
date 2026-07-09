# 00_PROJECT_OVERVIEW.md

# 📱 Lemburin

> **Catat. Hitung. Verifikasi.**

---

# Project Information

| Item            | Value                      |
| --------------- | -------------------------- |
| Project Name    | Lemburin                   |
| Type            | Mobile Application         |
| Platform        | Android & iOS              |
| Framework       | React Native (Expo)        |
| Language        | TypeScript                 |
| Backend         | Supabase                   |
| Database        | PostgreSQL                 |
| Authentication  | Email & Google OAuth       |
| Architecture    | Offline First + Cloud Sync |
| Current Version | MVP v1                     |
| Status          | Planning                   |

---

# Executive Summary

Lemburin adalah aplikasi mobile yang dirancang untuk membantu pekerja mencatat aktivitas lembur, menghitung estimasi upah lembur, dan memverifikasi hasil pembayaran lembur yang diterima dari perusahaan.

Tidak seperti aplikasi kalkulator lembur pada umumnya yang hanya menghitung sekali lalu selesai, Lemburin berfokus pada **pencatatan lembur selama satu periode gaji** sehingga pengguna dapat melihat total lembur, total jam, total estimasi pembayaran, serta membandingkannya dengan nominal pada slip gaji.

Dengan pendekatan ini, Lemburin berfungsi sebagai **Personal Overtime Tracker & Salary Verification App**.

---

# Vision

Menjadi aplikasi pencatat lembur pribadi yang paling mudah digunakan, akurat, dan terpercaya untuk membantu pekerja memahami serta memverifikasi hak lembur mereka.

---

# Mission

* Membantu pekerja mencatat seluruh aktivitas lembur.
* Mengurangi kesalahan perhitungan upah lembur.
* Memberikan estimasi pembayaran secara transparan.
* Membantu pengguna memverifikasi nominal lembur pada slip gaji.
* Menyimpan histori lembur berdasarkan periode gaji.
* Menyediakan pengalaman pengguna yang sederhana dan cepat.

---

# Product Positioning

Lemburin bukan aplikasi HRIS.

Lemburin bukan aplikasi Payroll.

Lemburin bukan aplikasi Attendance.

Lemburin adalah aplikasi **Personal Overtime Tracker**.

Seluruh data yang disimpan merupakan data pribadi milik pengguna dan hanya dapat diakses oleh pemilik akun.

---

# Target Users

## Primary Users

* Karyawan Swasta
* Operator Produksi
* Teknisi
* Security
* Driver
* Customer Service
* Staff Administrasi
* Pegawai Retail
* Pegawai Hotel
* Pegawai Rumah Sakit

---

## Secondary Users

Walaupun ditujukan untuk penggunaan pribadi, aplikasi juga dapat dimanfaatkan oleh:

* Supervisor
* HRD (untuk pengecekan cepat)
* Team Leader

---

# Problems

Banyak pekerja mengalami masalah berikut.

## Sulit mengingat tanggal lembur

Lembur dilakukan beberapa kali dalam satu bulan tetapi tidak pernah dicatat.

---

## Sulit mengetahui total jam lembur

Karena lembur tersebar di banyak tanggal.

---

## Sulit menghitung estimasi pembayaran

Setiap perusahaan memiliki metode yang berbeda.

---

## Sulit memverifikasi slip gaji

Nominal lembur pada slip sering kali sulit diverifikasi secara manual.

---

## Spreadsheet kurang praktis

Sebagian pekerja menggunakan Excel atau catatan manual yang sulit diakses dari perangkat mobile.

---

# Proposed Solution

Lemburin menyediakan solusi dalam tiga tahap.

## 1. Track

Pengguna mencatat setiap aktivitas lembur.

↓

## 2. Calculate

Aplikasi menghitung estimasi upah lembur berdasarkan formula yang dipilih.

↓

## 3. Verify

Pengguna membandingkan hasil perhitungan dengan slip gaji perusahaan.

---

# Core Concept

Seluruh aplikasi dibangun menggunakan konsep berikut.

```text
Pay Period
        │
        ▼
Overtime Logs
        │
        ▼
Calculation
        │
        ▼
Monthly Summary
        │
        ▼
Salary Verification
```

Perhitungan bukan tujuan utama.

Perhitungan adalah bagian dari proses pencatatan lembur.

---

# Product Goals

## Goal 1

Mengurangi kesalahan perhitungan lembur.

---

## Goal 2

Membantu pengguna mengetahui total hak lembur sebelum menerima gaji.

---

## Goal 3

Membantu pengguna menemukan selisih pembayaran lembur.

---

## Goal 4

Memberikan histori lembur yang rapi.

---

## Goal 5

Menyediakan pengalaman penggunaan kurang dari 30 detik untuk menambahkan satu data lembur.

---

# Success Metrics

| Metric              | Target    |
| ------------------- | --------- |
| Login Success       | >99%      |
| Crash Rate          | <1%       |
| Formula Calculation | <100 ms   |
| Add Overtime        | <30 detik |
| Sync Success        | >99%      |
| User Satisfaction   | ≥4.5/5    |

---

# MVP Scope

Versi pertama mencakup:

## Authentication

* Register
* Login
* Google Sign In
* Email Verification
* Forgot Password

---

## Company Profile

Menyimpan informasi perusahaan tempat pengguna bekerja.

---

## Pay Period

Mendukung periode gaji yang fleksibel.

Contoh:

* 1 – 31
* 21 – 20
* 26 – 25

---

## Formula

Tiga jenis formula:

* Formula Indonesia
* Flat Rate
* Custom Personal

---

## Overtime Tracking

Mencatat aktivitas lembur.

---

## Calendar

Melihat tanggal-tanggal lembur.

---

## Monthly Summary

Ringkasan satu periode.

---

## Salary Verification

Membandingkan estimasi dengan slip gaji.

---

## History

Riwayat seluruh periode.

---

## Settings

Pengaturan aplikasi.

---

# Out of Scope

Tidak termasuk dalam MVP.

* Multi User
* Payroll
* Attendance
* Admin Dashboard
* Shift Management
* Fingerprint Machine
* Export PDF
* Export Excel
* OCR Slip Gaji
* AI Recommendation
* Push Notification
* Widget

---

# High-Level Architecture

```text
                React Native
                     │
                     ▼
               Expo Router
                     │
                     ▼
              Authentication
                     │
                     ▼
                Supabase Auth
                     │
                     ▼
               PostgreSQL DB
                     │
                     ▼
            Row Level Security
                     │
                     ▼
             Cloud Synchronization
```

---

# Core Modules

1. Authentication

2. Company Profile

3. Pay Period

4. Formula

5. Overtime Tracking

6. Calendar

7. Monthly Summary

8. Salary Verification

9. History

10. Settings

---

# Formula Types

MVP hanya mendukung tiga jenis formula.

## Formula Indonesia

Mengikuti aturan lembur Indonesia.

---

## Flat Rate

Tarif tetap per jam.

---

## Custom Formula

Formula pribadi.

---

# Pay Period

Pay Period adalah konsep utama aplikasi.

Semua aktivitas lembur akan dikelompokkan berdasarkan periode gaji.

Contoh.

Periode:

21 Juni

↓

20 Juli

Maka seluruh lembur pada rentang tanggal tersebut akan menjadi satu laporan.

Hal ini memudahkan pengguna membandingkan hasil dengan slip gaji.

---

# Security

* HTTPS Only
* JWT Authentication
* Row Level Security
* Secure Token Storage
* Encrypted Connection
* User Isolation

---

# Scalability

Walaupun MVP hanya mendukung tiga formula, struktur aplikasi harus memungkinkan penambahan formula baru pada versi berikutnya tanpa mengubah data lama.

---

# Risks

* Perubahan regulasi lembur.
* Pengguna salah memasukkan data.
* Sinkronisasi gagal saat offline.
* Kesalahan konfigurasi formula.

---

# Assumptions

* Pengguna memiliki email aktif.
* Pengguna mengetahui data gaji dan periode gaji.
* Perusahaan memberikan informasi pembayaran lembur pada slip gaji.
* Perangkat memiliki akses internet untuk sinkronisasi.

---

# Future Vision

Setelah MVP selesai, aplikasi dapat dikembangkan dengan:

* OCR Slip Gaji
* AI Formula Recommendation
* Export PDF
* Export Excel
* Backup ke Google Drive
* Multi Device Sync
* Dashboard Statistik
* Grafik Lembur
* Reminder Pengisian Lembur
* Widget Android & iOS

---

# Related Documents

Dokumen ini menjadi fondasi bagi seluruh dokumentasi proyek.

Selanjutnya baca:

* 01_PRD.md
* 02_APP_FLOW.md
* 03_USER_STORIES.md
* 04_FEATURE_LIST.md
* 05_DATABASE.md
* 06_ERD.md
