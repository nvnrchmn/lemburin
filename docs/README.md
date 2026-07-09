# 📱 Lemburin

> **Catat. Hitung. Verifikasi.**

Lemburin adalah aplikasi mobile berbasis **React Native** yang membantu pekerja mencatat aktivitas lembur, menghitung estimasi upah lembur, serta memverifikasi nominal pembayaran lembur yang diterima dari perusahaan.

Berbeda dengan aplikasi kalkulator lembur pada umumnya, Lemburin dirancang sebagai **Personal Overtime Tracker & Salary Verification App**, sehingga pengguna dapat menyimpan seluruh riwayat lembur berdasarkan periode gaji dan membandingkannya dengan slip gaji yang diterima.

---

# 📖 Table of Contents

* Overview
* Vision
* Mission
* Problem Statement
* Solution
* Core Features
* MVP Scope
* Technology Stack
* Project Structure
* Documentation
* Development Workflow
* Coding Principles
* Versioning
* License

---

# 📌 Overview

Lemburin merupakan aplikasi untuk penggunaan pribadi (**Personal Use**) yang memungkinkan pengguna:

* Mencatat aktivitas lembur setiap hari.
* Menghitung estimasi upah lembur.
* Menggunakan berbagai metode perhitungan.
* Menyimpan histori lembur.
* Mengelompokkan data berdasarkan periode gaji.
* Membandingkan hasil perhitungan dengan slip gaji perusahaan.

Seluruh data tersimpan secara aman menggunakan **Supabase** dan dapat disinkronkan antar perangkat setelah pengguna melakukan login.

---

# 🎯 Vision

Menjadi aplikasi pencatat lembur pribadi yang membantu pekerja mengelola, menghitung, dan memverifikasi pembayaran lembur secara mudah, akurat, dan transparan.

---

# 🚀 Mission

* Membantu pekerja mencatat seluruh aktivitas lembur.
* Mengurangi kesalahan perhitungan upah lembur.
* Memberikan estimasi pembayaran lembur secara cepat.
* Membantu pengguna memverifikasi pembayaran lembur dari perusahaan.
* Menyediakan histori lembur berdasarkan periode gaji.
* Memberikan pengalaman pengguna yang sederhana namun profesional.

---

# ❗ Problem Statement

Banyak pekerja mengalami kesulitan untuk:

* Mengingat tanggal-tanggal lembur.
* Menghitung total lembur selama satu periode gaji.
* Mengetahui estimasi upah lembur.
* Memastikan pembayaran lembur pada slip gaji sudah sesuai.
* Menyesuaikan perhitungan dengan aturan perusahaan yang berbeda.

Spreadsheet sering kali kurang praktis, sedangkan aplikasi yang ada umumnya hanya berfungsi sebagai kalkulator sederhana tanpa fitur pencatatan maupun verifikasi.

---

# 💡 Solution

Lemburin menawarkan solusi melalui tiga pilar utama:

## 1. Overtime Tracking

Catat setiap aktivitas lembur secara lengkap.

Contoh data:

* Tanggal
* Jam mulai
* Jam selesai
* Durasi istirahat (opsional)
* Catatan

---

## 2. Overtime Calculation

Hitung estimasi upah lembur menggunakan salah satu metode berikut:

### Formula Indonesia

Perhitungan sesuai aturan yang berlaku di Indonesia.

### Flat Rate

Tarif tetap per jam.

### Custom Formula

Formula pribadi yang dapat disesuaikan pengguna.

---

## 3. Salary Verification

Bandingkan hasil perhitungan aplikasi dengan nominal lembur pada slip gaji sehingga pengguna dapat mengetahui apakah pembayaran lembur sudah sesuai.

---

# ⭐ Core Features

## Authentication

* Register
* Login
* Google Sign In
* Email Verification
* Forgot Password
* Logout

---

## Company Profile

Menyimpan informasi tempat kerja pengguna, seperti:

* Nama perusahaan
* Periode gaji
* Formula default
* Gaji bulanan
* Jam kerja bulanan

Pengguna dapat memiliki lebih dari satu profil perusahaan.

---

## Pay Period

Mendukung periode gaji yang fleksibel, misalnya:

* 1 – 31
* 21 – 20
* 26 – 25

Tidak terbatas pada bulan kalender.

---

## Overtime Tracking

Mencatat setiap aktivitas lembur berdasarkan tanggal dan periode gaji.

---

## Formula Engine

MVP hanya mendukung tiga jenis formula:

1. Formula UU Ketenagakerjaan Indonesia
2. Flat Rate per Jam
3. Custom Personal Formula

---

## History

Riwayat seluruh aktivitas lembur.

---

## Monthly Summary

Ringkasan lembur dalam satu periode:

* Jumlah hari lembur
* Total jam lembur
* Total estimasi upah lembur

---

## Salary Verification

Membandingkan:

* Estimasi dari aplikasi
* Nominal pada slip gaji

Lalu menampilkan status:

* Sesuai
* Ada Selisih
* Belum Diverifikasi

---

## Calendar View

Menampilkan tanggal-tanggal ketika pengguna melakukan lembur.

---

## Settings

* Dark Mode
* Light Mode
* Bahasa
* Mata Uang
* Profil

---

# 🎯 MVP Scope

Versi pertama akan mencakup:

* Authentication
* Google Login
* Email Verification
* Company Profile
* Pay Period
* Formula Indonesia
* Flat Rate
* Custom Formula
* Overtime Tracking
* History
* Monthly Summary
* Salary Verification
* Calendar View
* Settings

---

# 🚫 Out of Scope

Belum termasuk pada MVP:

* Payroll
* Multi User
* Admin Dashboard
* Attendance
* Fingerprint Machine
* OCR Slip Gaji
* AI Formula Recommendation
* AI Salary Detection
* Export PDF
* Export Excel
* Push Notification
* Widget Home Screen

---

# 🛠 Technology Stack

## Mobile

* React Native
* Expo
* Expo Router
* TypeScript

## UI

* NativeWind
* React Native Reusables

## Backend

* Supabase

## Database

* PostgreSQL

## Authentication

* Supabase Auth

## Storage

* Supabase Storage

## State Management

* Zustand

## Form Validation

* React Hook Form
* Zod

---

# 📂 Project Structure

```text
docs/
src/
assets/
components/
constants/
hooks/
navigation/
screens/
services/
stores/
types/
utils/
supabase/
```

---

# 📚 Documentation

Seluruh dokumentasi proyek berada pada folder **docs/**.

| File                    | Description                  |
| ----------------------- | ---------------------------- |
| README.md               | Project Introduction         |
| 00_PROJECT_OVERVIEW.md  | Gambaran umum proyek         |
| 01_PRD.md               | Product Requirement Document |
| 02_APP_FLOW.md          | Alur aplikasi                |
| 03_USER_STORIES.md      | User Stories                 |
| 04_FEATURE_LIST.md      | Daftar fitur                 |
| 05_DATABASE.md          | Desain database              |
| 06_ERD.md               | Entity Relationship Diagram  |
| 07_API.md               | API Specification            |
| 08_AUTH.md              | Authentication Flow          |
| 09_SECURITY.md          | Security Guideline           |
| 10_FORMULA_ENGINE.md    | Formula Engine               |
| 11_CALCULATION_RULE.md  | Aturan Perhitungan           |
| 12_UI_GUIDELINE.md      | Panduan UI                   |
| 13_DESIGN_SYSTEM.md     | Design System                |
| 14_FOLDER_STRUCTURE.md  | Struktur proyek              |
| 15_STATE_MANAGEMENT.md  | State Management             |
| 16_SUPABASE_SETUP.md    | Setup Supabase               |
| 17_RLS_POLICY.md        | Row Level Security           |
| 18_EDGE_FUNCTIONS.md    | Edge Functions               |
| 19_TESTING.md           | Testing Strategy             |
| 20_RELEASE_CHECKLIST.md | Checklist Release            |
| 21_ROADMAP.md           | Roadmap Produk               |
| CHANGELOG.md            | Riwayat Perubahan            |

---

# 🔄 Development Workflow

```
Planning
    ↓
Documentation
    ↓
Database Design
    ↓
Authentication
    ↓
Core Features
    ↓
Testing
    ↓
Release
```

---

# 📏 Coding Principles

* Clean Architecture
* Modular Code
* Reusable Components
* Offline First (untuk pencatatan & perhitungan)
* Secure by Default
* Type Safety
* Consistent Naming Convention
* Documentation First Development

---

# 🌿 Branch Strategy

* `main` → Production
* `develop` → Development
* `feature/*` → New Feature
* `fix/*` → Bug Fix
* `hotfix/*` → Critical Fix

---

# 📌 Versioning

Menggunakan **Semantic Versioning**.

Contoh:

```
v1.0.0
v1.1.0
v1.2.0
v2.0.0
```

---

# 🤝 Contributing

Saat ini proyek dikembangkan sebagai aplikasi personal. Di masa depan repositori dapat dibuka untuk kontribusi komunitas jika diperlukan.

---

# 📄 License

MIT License

---

> **Lemburin** dibuat untuk membantu pekerja mencatat, menghitung, dan memverifikasi hak lembur mereka dengan cara yang sederhana, transparan, dan akurat.
