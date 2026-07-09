# 03_USER_STORIES.md

# 📱 Lemburin — User Stories

---

# Overview

Dokumen ini berisi seluruh kebutuhan pengguna dalam bentuk User Stories.

Setiap User Story ditulis menggunakan format:

> Sebagai **[User]**, saya ingin **[Goal]**, sehingga **[Benefit]**.

Seluruh User Stories akan menjadi acuan utama dalam penyusunan Sprint Backlog, Task Development, dan Quality Assurance.

---

# Epic 1 — Authentication

## US-001 — Register

**Priority:** Must Have

**User Story**

Sebagai pengguna baru, saya ingin membuat akun menggunakan email agar data lembur saya dapat disimpan dengan aman.

### Acceptance Criteria

* Pengguna dapat mendaftar menggunakan email.
* Password minimal 8 karakter.
* Email harus unik.
* Pengguna menerima email verifikasi.
* Akun tidak dapat digunakan sebelum email diverifikasi.

---

## US-002 — Login

**Priority:** Must Have

Sebagai pengguna, saya ingin login agar dapat mengakses seluruh data lembur saya.

### Acceptance Criteria

* Login menggunakan email.
* Login menggunakan password.
* Login berhasil menampilkan Dashboard.

---

## US-003 — Google Sign In

**Priority:** Must Have

Sebagai pengguna, saya ingin masuk menggunakan akun Google agar proses login lebih cepat.

---

## US-004 — Forgot Password

**Priority:** Must Have

Sebagai pengguna, saya ingin mengatur ulang password apabila lupa.

---

# Epic 2 — Profile

## US-005 — Update Profile

**Priority:** Must Have

Sebagai pengguna, saya ingin memperbarui data profil saya.

### Acceptance Criteria

Pengguna dapat mengubah:

* Nama
* Foto Profil
* Nomor HP (opsional)

---

# Epic 3 — Company Profile

## US-006 — Add Company

**Priority:** Must Have

Sebagai pengguna, saya ingin menyimpan informasi perusahaan tempat saya bekerja agar pencatatan lembur lebih terorganisir.

### Acceptance Criteria

Pengguna dapat mengisi:

* Nama Perusahaan
* Divisi (opsional)
* Jabatan (opsional)

---

## US-007 — Edit Company

Priority: Should Have

Pengguna dapat mengubah informasi perusahaan.

---

# Epic 4 — Pay Period

## US-008 — Create Pay Period

Priority: Must Have

Sebagai pengguna, saya ingin menentukan periode gaji agar seluruh catatan lembur dikelompokkan sesuai siklus pembayaran gaji saya.

### Acceptance Criteria

Pengguna dapat memilih:

* 1–31
* 21–20
* 26–25
* Kustom

---

## US-009 — Update Pay Period

Priority: Should Have

Pengguna dapat mengubah periode gaji untuk penggunaan berikutnya.

---

# Epic 5 — Formula

## US-010 — Choose Formula

Priority: Must Have

Sebagai pengguna, saya ingin memilih metode perhitungan lembur yang sesuai dengan kondisi saya.

### Acceptance Criteria

Pilihan formula:

* Indonesia
* Flat Rate
* Custom

---

## US-011 — Configure Flat Rate

Priority: Must Have

Sebagai pengguna, saya ingin menentukan tarif lembur per jam agar estimasi pembayaran sesuai dengan kesepakatan di tempat kerja saya.

---

## US-012 — Configure Custom Formula

Priority: Could Have

Sebagai pengguna, saya ingin membuat rumus perhitungan sendiri jika perusahaan saya memiliki kebijakan yang berbeda.

---

# Epic 6 — Overtime Tracking

## US-013 — Add Overtime Record

Priority: Must Have

Sebagai pengguna, saya ingin mencatat aktivitas lembur setiap selesai bekerja agar tidak lupa.

### Acceptance Criteria

Data yang dicatat:

* Tanggal
* Jam Mulai
* Jam Selesai
* Waktu Istirahat (opsional)
* Catatan (opsional)

---

## US-014 — Edit Overtime Record

Priority: Must Have

Pengguna dapat mengubah catatan lembur sebelum periode tersebut ditutup.

---

## US-015 — Delete Overtime Record

Priority: Must Have

Pengguna dapat menghapus catatan lembur.

---

## US-016 — View Overtime Detail

Priority: Must Have

Pengguna dapat melihat rincian satu catatan lembur.

---

# Epic 7 — Calendar

## US-017 — Calendar View

Priority: Must Have

Sebagai pengguna, saya ingin melihat tanggal-tanggal yang memiliki catatan lembur melalui kalender.

---

# Epic 8 — Monthly Summary

## US-018 — View Summary

Priority: Must Have

Sebagai pengguna, saya ingin melihat ringkasan lembur dalam satu periode gaji.

### Acceptance Criteria

Menampilkan:

* Total Hari Lembur
* Total Jam Lembur
* Total Estimasi Upah
* Total Catatan

---

## US-019 — Breakdown Calculation

Priority: Must Have

Sebagai pengguna, saya ingin melihat rincian perhitungan agar memahami bagaimana estimasi upah dihitung.

---

# Epic 9 — Salary Verification

## US-020 — Input Salary Slip Value

Priority: Must Have

Sebagai pengguna, saya ingin memasukkan nominal lembur dari slip gaji agar dapat dibandingkan dengan hasil perhitungan aplikasi.

---

## US-021 — Compare Result

Priority: Must Have

Sebagai pengguna, saya ingin melihat apakah terdapat selisih antara estimasi dan nominal pada slip gaji.

### Acceptance Criteria

Menampilkan:

* Estimasi Lemburin
* Nominal Slip Gaji
* Selisih Nominal
* Persentase Selisih

---

# Epic 10 — History

## US-022 — View History

Priority: Must Have

Sebagai pengguna, saya ingin melihat seluruh histori periode gaji yang pernah dicatat.

---

## US-023 — Search History

Priority: Should Have

Pengguna dapat mencari histori berdasarkan bulan atau tahun.

---

# Epic 11 — Offline & Sync

## US-024 — Offline Recording

Priority: Must Have

Sebagai pengguna, saya ingin tetap dapat mencatat lembur tanpa koneksi internet.

---

## US-025 — Auto Synchronization

Priority: Must Have

Sebagai pengguna, saya ingin data otomatis tersinkronisasi ketika koneksi internet tersedia.

---

# Epic 12 — Settings

## US-026 — Change Theme

Priority: Could Have

Pengguna dapat memilih mode terang atau gelap.

---

## US-027 — Logout

Priority: Must Have

Pengguna dapat keluar dari akun dengan aman.

---

# MVP Summary

| Epic                |             Stories |
| ------------------- | ------------------: |
| Authentication      |                   4 |
| Profile             |                   1 |
| Company Profile     |                   2 |
| Pay Period          |                   2 |
| Formula             |                   3 |
| Overtime Tracking   |                   4 |
| Calendar            |                   1 |
| Monthly Summary     |                   2 |
| Salary Verification |                   2 |
| History             |                   2 |
| Offline & Sync      |                   2 |
| Settings            |                   2 |
| **Total**           | **27 User Stories** |

---

# Definition of Done

Sebuah User Story dinyatakan selesai apabila:

* Acceptance Criteria terpenuhi.
* Telah melalui code review.
* Lulus pengujian QA.
* Tidak terdapat bug kritis.
* Dokumentasi diperbarui jika diperlukan.
* Siap dirilis pada sprint yang ditentukan.
