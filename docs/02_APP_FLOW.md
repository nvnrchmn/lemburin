# 02_APP_FLOW.md

# 📱 Lemburin — Application Flow

---

# Overview

Dokumen ini menjelaskan alur penggunaan aplikasi Lemburin dari pertama kali pengguna membuka aplikasi hingga melakukan verifikasi pembayaran lembur.

Flow ini menjadi acuan bagi:

* UI/UX Design
* Product Requirement Document (PRD)
* User Stories
* Development
* Quality Assurance (QA)

---

# Design Principles

Seluruh alur aplikasi mengikuti prinsip berikut.

* Sesedikit mungkin langkah untuk menyelesaikan tugas.
* Input lembur maksimal 30 detik.
* Satu layar memiliki satu tujuan utama.
* Hindari pengisian data yang berulang.
* Prioritaskan penggunaan satu tangan (thumb-friendly).
* Seluruh proses penting harus dapat dilakukan secara offline.
* Sinkronisasi dilakukan otomatis ketika koneksi tersedia.

---

# Application Overview

```text
Splash
   │
   ▼
Authentication
   │
   ▼
Onboarding
   │
   ▼
Initial Setup
   │
   ▼
Dashboard
   │
   ├──────────────┐
   ▼              ▼
Add Overtime   Calendar
   │              │
   ▼              ▼
Summary      History
   │              │
   └──────┬───────┘
          ▼
Salary Verification
          │
          ▼
Settings
```

---

# Flow 1 — First Time User

## Objective

Membantu pengguna baru menyiapkan aplikasi hingga siap digunakan.

## Entry Point

Aplikasi pertama kali dibuka.

## Flow

```text
Splash

↓

Welcome

↓

Register / Login

↓

Email Verification

↓

Create Profile

↓

Create Company Profile

↓

Setup Pay Period

↓

Choose Formula

↓

Dashboard
```

## Result

Pengguna siap mulai mencatat lembur.

---

# Flow 2 — Returning User

## Entry Point

Aplikasi dibuka kembali.

## Flow

```text
Splash

↓

Auto Login

↓

Dashboard
```

Jika token kedaluwarsa:

```text
Splash

↓

Login

↓

Dashboard
```

---

# Flow 3 — Add New Overtime

## Objective

Mencatat satu aktivitas lembur.

## Entry Point

Dashboard

## Flow

```text
Dashboard

↓

Tap (+)

↓

Overtime Form

↓

Save

↓

Calculation

↓

Updated Summary

↓

Dashboard
```

## Input Data

* Tanggal
* Jam mulai
* Jam selesai
* Waktu istirahat (opsional)
* Jenis hari (opsional jika dapat ditentukan otomatis)
* Catatan (opsional)

## Output

Data lembur tersimpan dalam periode gaji yang aktif.

---

# Flow 4 — View Calendar

## Entry Point

Bottom Navigation → Calendar

## Flow

```text
Calendar

↓

Select Date

↓

Overtime Detail

↓

Back
```

## Result

Pengguna dapat melihat seluruh tanggal yang memiliki catatan lembur.

---

# Flow 5 — View Monthly Summary

## Entry Point

Dashboard

## Flow

```text
Dashboard

↓

Summary Card

↓

Monthly Summary

↓

Detail Breakdown
```

## Information Displayed

* Total Hari Lembur
* Total Jam Lembur
* Total Estimasi Upah
* Total Hari Libur
* Total Hari Kerja dengan Lembur

---

# Flow 6 — Salary Verification

## Objective

Membandingkan estimasi aplikasi dengan nominal pada slip gaji.

## Entry Point

Dashboard atau Monthly Summary.

## Flow

```text
Monthly Summary

↓

Input Nominal Slip Gaji

↓

Compare

↓

Verification Result
```

## Output

Ditampilkan:

* Estimasi Lemburin
* Nominal Slip Gaji
* Selisih
* Persentase Perbedaan

---

# Flow 7 — View History

## Flow

```text
History

↓

Select Pay Period

↓

Monthly Summary

↓

Overtime Details
```

Pengguna dapat melihat seluruh periode gaji yang pernah dicatat.

---

# Flow 8 — Edit Overtime

```text
History

↓

Overtime Detail

↓

Edit

↓

Save

↓

Recalculate

↓

Summary Updated
```

---

# Flow 9 — Delete Overtime

```text
History

↓

Overtime Detail

↓

Delete

↓

Confirmation

↓

Summary Updated
```

---

# Flow 10 — Change Formula

```text
Settings

↓

Formula

↓

Choose Formula

↓

Confirmation

↓

Recalculate Existing Data? (Opsional)

↓

Save
```

Catatan:
Perubahan formula tidak boleh mengubah data historis secara otomatis kecuali pengguna memilih untuk menghitung ulang.

---

# Flow 11 — Change Pay Period

```text
Settings

↓

Pay Period

↓

Select Period

↓

Save
```

Perubahan hanya berlaku untuk periode berikutnya kecuali pengguna melakukan penyesuaian secara manual.

---

# Flow 12 — Offline Mode

```text
Open App

↓

Offline Detected

↓

Continue Offline

↓

Save Local

↓

Internet Available

↓

Auto Sync
```

Selama offline, seluruh fitur inti tetap dapat digunakan kecuali autentikasi dan sinkronisasi.

---

# Flow 13 — Cloud Synchronization

```text
Local Database

↓

Pending Changes

↓

Sync

↓

Supabase

↓

Completed
```

Jika terjadi konflik data:

1. Prioritaskan perubahan terbaru (last-write-wins) untuk MVP.
2. Tandai konflik pada log sinkronisasi untuk evaluasi di versi berikutnya.

---

# Bottom Navigation

```text
Dashboard

Calendar

+

History

Settings
```

Tombol tengah (+) selalu digunakan untuk menambahkan catatan lembur baru agar mudah dijangkau dengan ibu jari.

---

# Global Navigation Rules

* Pengguna maksimal dua ketukan dari Dashboard untuk membuat catatan lembur.
* Tombol kembali tidak boleh menghilangkan data yang belum disimpan tanpa konfirmasi.
* Semua proses penyimpanan menampilkan umpan balik yang jelas.
* Perhitungan dilakukan otomatis setelah data berhasil disimpan.
* Dashboard selalu menampilkan ringkasan periode gaji yang sedang aktif.

---

# Screen List (MVP)

| No | Screen              |
| -- | ------------------- |
| 1  | Splash              |
| 2  | Welcome             |
| 3  | Login               |
| 4  | Register            |
| 5  | Email Verification  |
| 6  | Forgot Password     |
| 7  | Dashboard           |
| 8  | Add Overtime        |
| 9  | Edit Overtime       |
| 10 | Overtime Detail     |
| 11 | Calendar            |
| 12 | Monthly Summary     |
| 13 | Salary Verification |
| 14 | History             |
| 15 | Settings            |
| 16 | Company Profile     |
| 17 | Pay Period          |
| 18 | Formula Selection   |
| 19 | User Profile        |

---

# User Journey Summary

```text
Install App
      │
      ▼
Register
      │
      ▼
Setup Awal
      │
      ▼
Dashboard
      │
      ▼
Catat Lembur Setiap Hari
      │
      ▼
Ringkasan Periode Gaji
      │
      ▼
Terima Slip Gaji
      │
      ▼
Verifikasi Nominal Lembur
      │
      ▼
Simpan Riwayat
```
