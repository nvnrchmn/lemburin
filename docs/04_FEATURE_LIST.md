# 04_FEATURE_LIST.md

# 📱 Lemburin — Feature List

---

# Overview

Dokumen ini mendefinisikan seluruh fitur yang akan dikembangkan pada aplikasi Lemburin.

Feature List menjadi penghubung antara:

* Project Overview
* App Flow
* User Stories
* Database
* ERD
* Sprint Planning

Setiap fitur memiliki identitas unik (Feature ID) sehingga mudah ditelusuri selama proses pengembangan.

---

# Priority Legend

| Priority | Keterangan                                    |
| -------- | --------------------------------------------- |
| Must     | Wajib ada pada MVP                            |
| Should   | Penting tetapi dapat dirilis setelah MVP      |
| Could    | Nilai tambah, tidak menghambat peluncuran MVP |

---

# Epic 1 — Authentication

---

## FT-001 — User Registration

**Priority:** Must

**Related User Stories**

* US-001

### Description

Memungkinkan pengguna membuat akun menggunakan email dan password.

### Dependencies

* Supabase Auth

### MVP

✅ Ya

---

## FT-002 — User Login

**Priority:** Must

**Related User Stories**

* US-002

### Description

Autentikasi menggunakan email dan password.

### Dependencies

* FT-001

---

## FT-003 — Google Sign In

**Priority:** Must

**Related User Stories**

* US-003

### Dependencies

* Google OAuth
* Supabase Auth

---

## FT-004 — Forgot Password

**Priority:** Must

**Related User Stories**

* US-004

---

# Epic 2 — User Profile

---

## FT-005 — Profile Management

Priority

Must

Related Stories

US-005

### Features

* Edit nama
* Foto profil
* Nomor HP

---

# Epic 3 — Company Profile

---

## FT-006 — Company Information

Priority

Must

Related Stories

US-006
US-007

### Features

* Nama perusahaan
* Divisi
* Jabatan
* Lokasi kerja (opsional)

### Notes

Data hanya digunakan sebagai referensi pribadi dan tidak terhubung dengan sistem perusahaan.

---

# Epic 4 — Pay Period

---

## FT-007 — Pay Period Configuration

Priority

Must

Related Stories

US-008
US-009

### Features

* Pilih tanggal awal periode gaji.
* Hitung otomatis tanggal akhir periode.
* Mendukung periode kustom.

### Example

21 Juni

↓

20 Juli

---

# Epic 5 — Formula

---

## FT-008 — Formula Selection

Priority

Must

Related Stories

US-010

### Supported Formula

* Indonesia
* Flat Rate
* Custom

---

## FT-009 — Flat Rate Configuration

Priority

Must

Related Stories

US-011

### Features

Tarif lembur per jam dapat disesuaikan.

---

## FT-010 — Custom Formula Builder

Priority

Could

Related Stories

US-012

### Notes

Dirancang agar mendukung penambahan jenis formula baru pada versi berikutnya tanpa mengubah data historis.

---

# Epic 6 — Overtime Tracking

---

## FT-011 — Create Overtime Record

Priority

Must

Related Stories

US-013

### Fields

* Tanggal
* Jam Mulai
* Jam Selesai
* Istirahat
* Catatan

---

## FT-012 — Edit Overtime

Priority

Must

Related Stories

US-014

---

## FT-013 — Delete Overtime

Priority

Must

Related Stories

US-015

---

## FT-014 — Overtime Detail

Priority

Must

Related Stories

US-016

### Display

* Informasi lembur
* Durasi
* Formula
* Estimasi upah
* Catatan

---

# Epic 7 — Calendar

---

## FT-015 — Calendar View

Priority

Must

Related Stories

US-017

### Features

* Highlight tanggal lembur.
* Pilih tanggal.
* Lihat detail lembur.

---

# Epic 8 — Monthly Summary

---

## FT-016 — Monthly Summary

Priority

Must

Related Stories

US-018

### Display

* Total Hari Lembur
* Total Jam
* Total Estimasi Upah
* Jumlah Catatan

---

## FT-017 — Calculation Breakdown

Priority

Must

Related Stories

US-019

### Display

Rincian seluruh proses perhitungan.

---

# Epic 9 — Salary Verification

---

## FT-018 — Salary Slip Input

Priority

Must

Related Stories

US-020

### Features

Input nominal lembur dari slip gaji.

---

## FT-019 — Salary Comparison

Priority

Must

Related Stories

US-021

### Result

* Estimasi aplikasi
* Nominal slip
* Selisih
* Persentase

---

# Epic 10 — History

---

## FT-020 — History List

Priority

Must

Related Stories

US-022

---

## FT-021 — Search History

Priority

Should

Related Stories

US-023

### Filter

* Bulan
* Tahun

---

# Epic 11 — Offline

---

## FT-022 — Offline Storage

Priority

Must

Related Stories

US-024

### Description

Catatan lembur tetap dapat dibuat tanpa koneksi internet.

---

## FT-023 — Cloud Synchronization

Priority

Must

Related Stories

US-025

### Description

Sinkronisasi otomatis ketika perangkat kembali online.

---

# Epic 12 — Settings

---

## FT-024 — Theme Settings

Priority

Could

Related Stories

US-026

---

## FT-025 — Logout

Priority

Must

Related Stories

US-027

---

# MVP Feature Matrix

| Feature             | MVP |
| ------------------- | :-: |
| Authentication      |  ✅  |
| Company Profile     |  ✅  |
| Pay Period          |  ✅  |
| Formula             |  ✅  |
| Overtime Tracking   |  ✅  |
| Calendar            |  ✅  |
| Monthly Summary     |  ✅  |
| Salary Verification |  ✅  |
| History             |  ✅  |
| Offline Storage     |  ✅  |
| Cloud Sync          |  ✅  |
| Settings            |  ✅  |

---

# Feature Dependency

```text
Authentication
        │
        ▼
User Profile
        │
        ▼
Company Profile
        │
        ▼
Pay Period
        │
        ▼
Formula
        │
        ▼
Overtime Tracking
        │
        ▼
Monthly Summary
        │
        ▼
Salary Verification
        │
        ▼
History
```

---

# Future Features (Post-MVP)

Fitur berikut telah dipertimbangkan, namun tidak termasuk dalam ruang lingkup MVP:

| Feature                      | Priority |
| ---------------------------- | -------- |
| OCR Slip Gaji                | Future   |
| Export PDF                   | Future   |
| Export Excel                 | Future   |
| Dashboard Statistik Lanjutan | Future   |
| Grafik Pendapatan Lembur     | Future   |
| Reminder Input Lembur        | Future   |
| Widget Android & iOS         | Future   |
| Multi Device Sync            | Future   |
| AI Formula Recommendation    | Future   |
| Backup Google Drive          | Future   |

---

# Traceability Matrix

| Feature ID      | User Story      |
| --------------- | --------------- |
| FT-001 – FT-004 | US-001 – US-004 |
| FT-005          | US-005          |
| FT-006          | US-006, US-007  |
| FT-007          | US-008, US-009  |
| FT-008 – FT-010 | US-010 – US-012 |
| FT-011 – FT-014 | US-013 – US-016 |
| FT-015          | US-017          |
| FT-016 – FT-017 | US-018 – US-019 |
| FT-018 – FT-019 | US-020 – US-021 |
| FT-020 – FT-021 | US-022 – US-023 |
| FT-022 – FT-023 | US-024 – US-025 |
| FT-024 – FT-025 | US-026 – US-027 |
