# 📱 Lemburin

> **Catat Lembur. Hitung Hakmu.** Personal Overtime Tracker & Salary Verification App untuk pekerja Indonesia.

Lemburin adalah aplikasi mobile pribadi yang membantu pekerja di Indonesia mencatat aktivitas lembur, menghitung estimasi upah lembur berdasarkan ketentuan **PP 35/2021**, dan memverifikasi apakah nominal lembur pada slip gaji sudah sesuai.

Aplikasi ini **tidak terhubung dengan sistem perusahaan** — tidak butuh akses HR, atasan, atau administrator. Seluruh data dimiliki dan dikelola sepenuhnya oleh pengguna.

---

## ✨ Fitur Utama

- 📝 **Pencatatan Lembur Harian** — catat jam lembur dengan cepat, lengkap dengan flag hari libur (`is_holiday`)
- 🧮 **Kalkulasi Upah Otomatis** — perhitungan sesuai PP 35/2021 (jam pertama 1.5x, jam berikutnya 2x, hari libur 2x/3x/4x)
- 🏢 **Profil Perusahaan** — sistem kerja 5/6 hari, tunjangan makan & transport, status PTKP PPh 21 TER, opsi BPJS TK/Kesehatan
- 🗓️ **Periode Gaji** — kelola periode pembayaran, deteksi otomatis periode kadaluarsa, riwayat periode terkunci (*locked*)
- 📊 **Dashboard & Analytics** — ringkasan bulanan, grafik tahunan, badge peringatan 18 jam/minggu (batas regulasi)
- 🧾 **Verifikasi Slip Gaji** — bandingkan estimasi dengan nominal slip, upload foto slip & bukti SPL
- 📤 **Share via WhatsApp** — format laporan otomatis + opsi salin ke clipboard
- 🔐 **Autentikasi** — Email & Google OAuth
- 🔄 **Offline First** — data tersimpan lokal, sinkronisasi cloud otomatis saat online

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React Native (Expo SDK 57), TypeScript, Expo Router |
| **Styling** | NativeWind (Tailwind CSS v3) |
| **State** | Zustand + React Hook Form + Zod |
| **Backend** | Supabase (PostgreSQL) |
| **Auth** | Email & Google OAuth |
| **Charts** | react-native-gifted-charts, react-native-calendars |
| **CI/CD** | GitHub Actions (Android APK build otomatis) |

---

## 🚀 Menjalankan Proyek

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env
# Isi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Jalankan app
npx expo start
```

Buka di:
- **Expo Go** (mode development)
- **Android emulator** / **iOS simulator**
- **Development build** (`npx expo run:android`)

---

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder [`docs/`](docs/):

| Dokumen | Isi |
|---|---|
| [`00_PROJECT_OVERVIEW.md`](docs/00_PROJECT_OVERVIEW.md) | Ringkasan & visi produk |
| [`01_PRD.md`](docs/01_PRD.md) | Product Requirements Document |
| [`02_APP_FLOW.md`](docs/02_APP_FLOW.md) | Alur aplikasi |
| [`03_USER_STORIES.md`](docs/03_USER_STORIES.md) | User stories |
| [`04_FEATURE_LIST.md`](docs/04_FEATURE_LIST.md) | Daftar fitur |
| [`05_DATABASE.md`](docs/05_DATABASE.md) | Dokumentasi database |
| [`06_ERD.md`](docs/06_ERD.md) | Entity Relationship Diagram |
| [`07_DATABASE_SCHEMA.md`](docs/07_DATABASE_SCHEMA.md) | Skema database |
| [`08_API_SPEC.md`](docs/08_API_SPEC.md) | Spesifikasi API |
| [`09_SPRINT_BACKLOG.md`](docs/09_SPRINT_BACKLOG.md) | Sprint backlog & status |

---

## 🤝 Lisensi

Distribusi di bawah lisensi [MIT](LICENSE).

---

*Dibangun dengan ❤️ untuk pekerja Indonesia.*
