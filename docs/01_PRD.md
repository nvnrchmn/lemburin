# Product Requirements Document (PRD)

# Lemburin

**Versi:** 2.0 (Final Draft)
**Status:** Draft
**Produk:** Lemburin
**Tagline:** *Catat Lembur. Hitung Hakmu.*

---

# 1. Executive Summary

Lemburin adalah aplikasi personal yang membantu pekerja di Indonesia mencatat aktivitas lembur, menghitung estimasi upah lembur berdasarkan ketentuan yang berlaku, serta memverifikasi apakah pembayaran lembur yang diterima pada slip gaji telah sesuai.

Aplikasi ini tidak terhubung dengan sistem perusahaan dan tidak memerlukan akses dari HR, atasan, maupun administrator perusahaan. Seluruh data dimiliki dan dikelola sepenuhnya oleh pengguna.

Lemburin hadir sebagai alat bantu independen agar setiap pekerja memiliki catatan lembur yang rapi, mudah ditinjau kembali, dan dapat digunakan sebagai referensi ketika membandingkan hasil perhitungan pribadi dengan nominal lembur pada slip gaji.

Selain sebagai kalkulator lembur, Lemburin juga berfungsi sebagai jurnal aktivitas lembur yang membantu pengguna memahami pola kerja, total jam lembur, estimasi pendapatan dari lembur, serta riwayat lembur dalam jangka panjang.

---

# 2. Product Vision

Menjadi aplikasi personal terpercaya bagi pekerja Indonesia untuk mencatat, menghitung, dan memverifikasi hak lembur mereka secara mandiri.

---

# 3. Product Mission

Lemburin dibangun untuk:

* Membantu pekerja mencatat lembur setiap hari.
* Mengurangi kesalahan pencatatan lembur pribadi.
* Memberikan estimasi upah lembur secara transparan.
* Memudahkan pengguna membandingkan hasil perhitungan dengan slip gaji.
* Menyediakan histori lembur yang mudah diakses kapan pun.
* Memberikan insight mengenai kebiasaan lembur pengguna.

---

# 4. Problem Statement

Banyak pekerja mengalami beberapa kendala berikut:

* Lupa mencatat jam lembur.
* Tidak mengetahui cara menghitung upah lembur.
* Sulit memastikan apakah nominal lembur pada slip gaji sudah sesuai.
* Tidak memiliki riwayat lembur ketika terjadi perbedaan perhitungan.
* Kesulitan mengingat jumlah lembur dalam satu bulan.
* Tidak memiliki data ketika ingin mengajukan klarifikasi kepada perusahaan.

Lemburin membantu mengatasi masalah tersebut dengan menyediakan pencatatan yang sederhana, perhitungan otomatis, dan riwayat yang dapat diakses kapan saja.

---

# 5. Product Goals

## Tujuan Utama

Memberikan alat bantu yang sederhana namun akurat bagi pekerja untuk mengelola data lembur pribadi.

## Tujuan Bisnis

* Menjadi aplikasi referensi lembur nomor satu di Indonesia.
* Membangun kepercayaan melalui hasil perhitungan yang transparan.
* Menyediakan fondasi untuk layanan finansial dan ketenagakerjaan di masa depan.

## Tujuan Pengguna

Pengguna dapat:

* Mencatat lembur kurang dari satu menit.
* Mengetahui estimasi upah lembur secara instan.
* Mengetahui total lembur setiap bulan.
* Memverifikasi hasil pada slip gaji.

---

# 6. Non Goals

Versi awal Lemburin tidak mencakup:

* Sistem HRIS.
* Payroll perusahaan.
* Approval lembur.
* Absensi online.
* Manajemen karyawan.
* Penjadwalan kerja perusahaan.
* Pengelolaan organisasi.
* Pengajuan cuti.
* Penilaian kinerja.
* Rekrutmen.

Lemburin bukan aplikasi untuk perusahaan, melainkan aplikasi pendamping bagi pekerja.

---

# 7. Target Users

Target utama aplikasi adalah individu yang bekerja dan memperoleh kompensasi lembur.

Contohnya:

* Operator pabrik
* Teknisi
* Karyawan retail
* Pegawai gudang
* Driver logistik
* Customer Service
* Staf administrasi
* Programmer
* IT Support
* Perawat
* Apoteker
* Pegawai hotel
* Pegawai restoran
* Security
* Pekerja kontrak
* Pekerja tetap

---

# 8. User Persona

## Persona 1 — Karyawan Pabrik

Usia: 23 tahun

Bekerja dengan sistem shift dan sering lembur.

Masalah:

* Tidak pernah menghitung lembur sendiri.
* Hanya menerima nominal pada slip gaji.
* Tidak tahu apakah nominal tersebut benar.

Harapan:

* Bisa mencatat lembur setiap hari.
* Bisa mengetahui estimasi upah sebelum gajian.

---

## Persona 2 — Programmer

Sering bekerja melewati jam kantor.

Ingin mengetahui total waktu lembur setiap bulan sebagai dokumentasi pribadi.

---

## Persona 3 — Teknisi Lapangan

Sering bekerja pada hari libur.

Membutuhkan histori lengkap apabila terjadi perbedaan perhitungan.

---

# 9. Value Proposition

Lemburin memberikan manfaat berikut:

* Catatan lembur selalu tersedia.
* Perhitungan otomatis.
* Transparansi hak lembur.
* Mudah digunakan.
* Tidak bergantung pada sistem perusahaan.
* Data sepenuhnya milik pengguna.

---

# 10. Success Metrics

Target enam bulan pertama:

* 10.000 pengguna terdaftar.
* Retensi bulanan minimal 40%.
* 80% pengguna mencatat lembur minimal empat kali dalam satu bulan.
* Tingkat kepuasan pengguna minimal 4,5 dari 5.
* Waktu pencatatan lembur rata-rata kurang dari 60 detik.

---

# 11. Product Principles

## Simple

Pengguna dapat mulai menggunakan aplikasi tanpa pelatihan.

## Accurate

Perhitungan dilakukan secara konsisten berdasarkan konfigurasi yang dipilih pengguna dan aturan yang didukung aplikasi.

## Transparent

Semua komponen perhitungan ditampilkan secara terbuka agar mudah dipahami.

## Private

Data lembur hanya dapat diakses oleh pemilik akun.

## Helpful

Aplikasi tidak hanya menghitung, tetapi juga membantu pengguna memahami riwayat dan pola lemburnya.

---

# 12. Core Features Overview

Versi MVP akan berfokus pada kebutuhan utama pengguna.

### Dashboard

Menampilkan ringkasan aktivitas lembur.

### Pencatatan Lembur

Mencatat aktivitas lembur harian.

### Kalkulator Lembur

Menghitung estimasi upah lembur.

### Verifikasi Slip Gaji

Membandingkan hasil perhitungan pribadi dengan nominal pada slip gaji.

### Riwayat Lembur

Melihat seluruh catatan lembur yang pernah dibuat.

### Statistik

Menampilkan total jam lembur, estimasi pendapatan lembur, dan pola lembur pengguna.

### Pengaturan

Mengelola profil, preferensi, dan konfigurasi perhitungan.

---

# 13. Product Scope (MVP)

Fitur yang termasuk dalam versi pertama:

* Registrasi akun.
* Login.
* Profil pengguna.
* Pencatatan lembur.
* Kalkulator lembur.
* Riwayat lembur.
* Verifikasi slip gaji.
* Dashboard statistik.
* Kalender lembur.
* Ekspor data.
* Backup data.
* Sinkronisasi cloud.

---

# 14. Out of Scope (MVP)

Fitur berikut tidak termasuk pada versi awal:

* OCR slip gaji.
* Impor data absensi otomatis.
* Integrasi fingerprint.
* Integrasi HRIS perusahaan.
* Payroll.
* Approval atasan.
* AI Assistant.
* Integrasi BPJS.
* Integrasi Pajak PPh 21.
* Integrasi ERP.

---

# 15. Future Vision

Lemburin dirancang sebagai pendamping digital bagi pekerja yang dapat berkembang menjadi platform pengelolaan aktivitas kerja pribadi.

Dalam jangka panjang, aplikasi dapat menghadirkan kemampuan seperti pembacaan slip gaji menggunakan OCR, impor data absensi dari berbagai sumber, analisis pola lembur berbasis AI, simulasi penghasilan, serta integrasi dengan layanan ketenagakerjaan lainnya.

Namun, seluruh pengembangan tersebut tetap berpegang pada prinsip utama: **pengguna adalah pemilik penuh atas datanya, dan aplikasi berfungsi sebagai alat bantu independen untuk memahami serta memverifikasi informasi terkait lembur pribadi.**
