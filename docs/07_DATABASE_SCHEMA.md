# 07_DATABASE_SCHEMA.md

# 📱 Lemburin — Database Schema

---

# Overview

Dokumen ini menjelaskan struktur tabel, kolom, tipe data, relasi, dan aturan database untuk aplikasi **Lemburin**.

Database menggunakan:

* PostgreSQL
* Supabase
* UUID Primary Key
* Row Level Security (RLS)

---

# General Convention

## Primary Key

Semua tabel menggunakan:

```text
UUID
```

---

## Timestamp

Semua tabel memiliki:

* created_at
* updated_at

---

## Naming Convention

* Table : snake_case + plural
* Column : snake_case
* Primary Key : id
* Foreign Key : {table}_id

---

# TABLE : profiles

## Description

Menyimpan informasi profil pengguna.

| Column     | Type         | Null | Default           | Description        |
| ---------- | ------------ | ---- | ----------------- | ------------------ |
| id         | UUID         | No   | gen_random_uuid() | Primary Key        |
| user_id    | UUID         | No   | -                 | FK → auth.users.id |
| full_name  | VARCHAR(150) | No   | -                 | Nama lengkap       |
| avatar_url | TEXT         | Yes  | NULL              | URL foto profil    |
| timezone   | VARCHAR(100) | No   | 'Asia/Jakarta'    | Zona waktu         |
| language   | VARCHAR(10)  | No   | 'id'              | Bahasa             |
| currency   | VARCHAR(10)  | No   | 'IDR'             | Mata uang          |
| created_at | TIMESTAMPTZ  | No   | now()             | Dibuat pada        |
| updated_at | TIMESTAMPTZ  | No   | now()             | Diperbarui pada    |

### Index

* PK(id)
* UNIQUE(user_id)

---

# TABLE : employments

## Description

Riwayat pekerjaan pengguna.

| Column        | Type         | Null | Default           | Description        |
| ------------- | ------------ | ---- | ----------------- | ------------------ |
| id            | UUID         | No   | gen_random_uuid() | Primary Key        |
| user_id       | UUID         | No   | -                 | FK → auth.users.id |
| company_name  | VARCHAR(200) | No   | -                 | Nama perusahaan    |
| job_title     | VARCHAR(150) | Yes  | NULL              | Jabatan            |
| employee_code | VARCHAR(100) | Yes  | NULL              | Nomor karyawan     |
| start_date    | DATE         | No   | -                 | Mulai bekerja      |
| end_date      | DATE         | Yes  | NULL              | Selesai bekerja    |
| is_active     | BOOLEAN      | No   | TRUE              | Status pekerjaan   |
| created_at    | TIMESTAMPTZ  | No   | now()             | Dibuat pada        |
| updated_at    | TIMESTAMPTZ  | No   | now()             | Diperbarui pada    |

### Index

* PK(id)
* INDEX(user_id)
* INDEX(is_active)

---

# TABLE : pay_periods

## Description

Periode gaji yang menjadi pusat seluruh pencatatan lembur.

| Column                | Type          | Null | Default           | Description         |
| --------------------- | ------------- | ---- | ----------------- | ------------------- |
| id                    | UUID          | No   | gen_random_uuid() | Primary Key         |
| employment_id         | UUID          | No   | -                 | FK → employments.id |
| period_name           | VARCHAR(100)  | No   | -                 | Contoh: Juli 2026   |
| start_date            | DATE          | No   | -                 | Awal periode        |
| end_date              | DATE          | No   | -                 | Akhir periode       |
| formula_type          | VARCHAR(30)   | No   | 'indonesia'       | Jenis formula       |
| flat_rate_amount      | NUMERIC(12,2) | Yes  | NULL              | Tarif flat rate     |
| custom_formula_config | JSONB         | Yes  | NULL              | Formula kustom      |
| is_locked             | BOOLEAN       | No   | FALSE             | Status periode      |
| created_at            | TIMESTAMPTZ   | No   | now()             | Dibuat pada         |
| updated_at            | TIMESTAMPTZ   | No   | now()             | Diperbarui pada     |

### Index

* PK(id)
* INDEX(employment_id)
* INDEX(start_date)
* INDEX(end_date)

---

# TABLE : overtime_entries

## Description

Catatan aktivitas lembur.

| Column        | Type        | Null | Default           | Description         |
| ------------- | ----------- | ---- | ----------------- | ------------------- |
| id            | UUID        | No   | gen_random_uuid() | Primary Key         |
| pay_period_id | UUID        | No   | -                 | FK → pay_periods.id |
| work_date     | DATE        | No   | -                 | Tanggal lembur      |
| start_time    | TIME        | No   | -                 | Jam mulai           |
| end_time      | TIME        | No   | -                 | Jam selesai         |
| break_minutes | INTEGER     | No   | 0                 | Lama istirahat      |
| notes         | TEXT        | Yes  | NULL              | Catatan             |
| created_at    | TIMESTAMPTZ | No   | now()             | Dibuat pada         |
| updated_at    | TIMESTAMPTZ | No   | now()             | Diperbarui pada     |

### Index

* PK(id)
* INDEX(pay_period_id)
* INDEX(work_date)

---

# TABLE : salary_verifications

## Description

Verifikasi nominal lembur berdasarkan slip gaji.

| Column        | Type          | Null | Default           | Description         |
| ------------- | ------------- | ---- | ----------------- | ------------------- |
| id            | UUID          | No   | gen_random_uuid() | Primary Key         |
| pay_period_id | UUID          | No   | -                 | FK → pay_periods.id |
| slip_amount   | NUMERIC(12,2) | No   | 0                 | Nominal pada slip   |
| difference    | NUMERIC(12,2) | No   | 0                 | Selisih hasil       |
| notes         | TEXT          | Yes  | NULL              | Catatan             |
| verified_at   | TIMESTAMPTZ   | Yes  | NULL              | Waktu verifikasi    |
| created_at    | TIMESTAMPTZ   | No   | now()             | Dibuat pada         |
| updated_at    | TIMESTAMPTZ   | No   | now()             | Diperbarui pada     |

### Index

* PK(id)
* UNIQUE(pay_period_id)

---

# Foreign Keys

| Table                | Foreign Key   | References     |
| -------------------- | ------------- | -------------- |
| profiles             | user_id       | auth.users.id  |
| employments          | user_id       | auth.users.id  |
| pay_periods          | employment_id | employments.id |
| overtime_entries     | pay_period_id | pay_periods.id |
| salary_verifications | pay_period_id | pay_periods.id |

---

# Constraints

## Profiles

* Satu user hanya memiliki satu profile.

---

## Employments

* Satu user dapat memiliki banyak employment.
* Hanya satu employment yang aktif.

---

## Pay Periods

* Tidak boleh overlap pada employment yang sama.
* start_date harus lebih kecil atau sama dengan end_date.

---

## Overtime Entries

* end_time harus lebih besar dari start_time.
* break_minutes ≥ 0.
* work_date harus berada dalam rentang pay period.

---

## Salary Verification

* Satu pay period hanya memiliki satu salary verification.

---

# Row Level Security (RLS)

Semua tabel menggunakan Row Level Security.

Pengguna hanya dapat:

* SELECT data miliknya sendiri.
* INSERT data miliknya sendiri.
* UPDATE data miliknya sendiri.
* DELETE data miliknya sendiri.

---

# Entity Relationship Summary

```text
auth.users
      │
      ▼
profiles
      │
      ▼
employments
      │
      ▼
pay_periods
      ├──────────────┐
      ▼              ▼
overtime_entries  salary_verifications
```

---

# Database Summary

| Table                | Purpose              |
| -------------------- | -------------------- |
| auth.users           | Autentikasi pengguna |
| profiles             | Profil pengguna      |
| employments          | Riwayat pekerjaan    |
| pay_periods          | Periode gaji         |
| overtime_entries     | Catatan lembur       |
| salary_verifications | Verifikasi slip gaji |

---

# Total Tables

| Category           | Total |
| ------------------ | ----: |
| Supabase Auth      |     1 |
| Application Tables |     5 |
| **Total**          | **6** |
