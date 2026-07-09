# 05_DATABASE.md

# 📱 Lemburin — Database Design

---

# Overview

Dokumen ini menjelaskan struktur database utama yang digunakan pada aplikasi **Lemburin**.

Database dirancang berdasarkan prinsip:

* Sederhana
* Mudah dikembangkan
* Offline First
* Cloud Sync Ready
* Berorientasi pada pengguna (User-Centric)

Lemburin adalah aplikasi pencatatan lembur pribadi, sehingga seluruh data hanya dimiliki dan dapat diakses oleh pemilik akun.

---

# Database Architecture

```text
Supabase Auth
      │
      ▼
    users
      │
      ▼
   profiles
      │
      ▼
 employments
      │
      ▼
  pay_periods
   ├───────────────┐
   ▼               ▼
overtime_entries  salary_verifications
```

---

# Database Tables

## 1. users

Dikelola oleh **Supabase Auth**.

Berisi data autentikasi pengguna seperti:

* Email
* Password
* User ID

Tidak dikelola langsung oleh aplikasi.

---

## 2. profiles

Menyimpan informasi dasar pengguna.

### Fungsi

Profil pengguna aplikasi.

### Data

* Nama Lengkap
* Foto Profil
* Timezone
* Bahasa
* Mata Uang

---

## 3. employments

Menyimpan riwayat pekerjaan pengguna.

Satu pengguna dapat memiliki lebih dari satu riwayat pekerjaan.

### Contoh Data

* Nama Perusahaan
* Jabatan
* Nomor Karyawan (Opsional)
* Tanggal Mulai
* Tanggal Selesai
* Status Aktif

---

## 4. pay_periods

Merupakan inti dari aplikasi Lemburin.

Seluruh catatan lembur dikelompokkan berdasarkan periode gaji.

### Contoh

* 1 – 31
* 21 – 20
* 26 – 25

### Data

* Nama Periode
* Tanggal Mulai
* Tanggal Selesai
* Jenis Formula
* Tarif Flat Rate (jika digunakan)
* Konfigurasi Formula Kustom (opsional)
* Status Periode (Aktif/Selesai)

---

## 5. overtime_entries

Tabel transaksi utama.

Setiap baris mewakili satu aktivitas lembur.

### Data

* Tanggal
* Jam Mulai
* Jam Selesai
* Durasi Istirahat
* Catatan

Ringkasan seperti total jam atau total estimasi upah dihitung dari data ini dan tidak disimpan secara permanen.

---

## 6. salary_verifications

Digunakan untuk membandingkan hasil perhitungan aplikasi dengan nominal lembur pada slip gaji.

Satu data verifikasi terkait dengan satu periode gaji.

### Data

* Nominal Slip Gaji
* Selisih
* Catatan
* Tanggal Verifikasi

---

# Relationships

```text
User
 │
 └── Profile
      │
      └── Employment
             │
             └── Pay Period
                    ├── Overtime Entry
                    └── Salary Verification
```

---

# Data Ownership

Seluruh data dimiliki oleh pengguna yang sedang login.

Pengguna hanya dapat:

* Melihat data miliknya sendiri.
* Mengubah data miliknya sendiri.
* Menghapus data miliknya sendiri.

Keamanan data menggunakan **Supabase Row Level Security (RLS)**.

---

# Naming Convention

## Table

Menggunakan bentuk jamak (plural) dan format `snake_case`.

Contoh:

* profiles
* employments
* pay_periods
* overtime_entries

---

## Primary Key

Menggunakan UUID.

---

## Timestamp

Seluruh tabel memiliki:

* created_at
* updated_at

---

# Database Principles

* Tidak menyimpan data yang dapat dihitung ulang.
* Tidak membuat tabel yang belum dibutuhkan pada MVP.
* Menggunakan snapshot konfigurasi pada `pay_periods` agar histori tetap konsisten.
* Mendukung sinkronisasi offline dan online.

---

# Future Expansion

Struktur database ini dirancang agar mudah dikembangkan untuk fitur berikut:

* OCR Slip Gaji
* Export PDF
* Export Excel
* Grafik Lembur
* Dashboard Statistik
* AI Recommendation
* Multi Device Sync
* Backup Google Drive
* Formula Tambahan
