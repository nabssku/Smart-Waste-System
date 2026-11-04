# Smart Waste Management — Mobile Application (`mobile/`)

Aplikasi Mobile berbasis **Flutter** untuk warga pelapor dalam mengirimkan laporan timbulan sampah lengkap dengan tangkapan foto Kamera/Galeri, deteksi kategori AI CNN otomatis (`POST /api/ml/predict`), koordinat GPS (`geolocator`), pratinjau sebelum kirim, serta pelacakan riwayat status (`report_logs`).

---

## 1. Arsitektur Direktori (`mobile/lib/`)

```text
mobile/
├── android/app/src/main/AndroidManifest.xml  # Izin Internet, Kamera, Galeri, & GPS
├── ios/Runner/Info.plist                     # Deskripsi izin Kamera, Galeri, & Lokasi iOS
├── lib/
│   ├── main.dart                             # Entry point MultiProvider & Auth Router
│   ├── theme/
│   │   └── app_theme.dart                    # Sistem desain Municipal Ledger (#F4F4F0, #111315, #1E4D2B)
│   ├── models/
│   │   ├── user_model.dart                   # Model profil warga & autentikasi
│   │   └── report_model.dart                 # Model laporan, audit log, statistik, & prediksi AI
│   ├── services/
│   │   ├── storage_service.dart              # Persistensi token JWT & sesi (SharedPreferences)
│   │   ├── api_service.dart                  # Klien HTTP Dio + Interceptor Auto-Refresh JWT (401)
│   │   └── location_service.dart             # Akuisisi GPS (Geolocator) & Reverse Geocoding
│   ├── providers/
│   │   ├── auth_provider.dart                # State management Login, Register, Demo Login, & Sesi
│   │   └── report_provider.dart              # State management Statistik, CRUD Laporan, & Deteksi AI
│   ├── widgets/
│   │   ├── status_badge.dart                 # Lencana status laporan & kategori sampah
│   │   ├── report_card.dart                  # Kartu item daftar laporan
│   │   └── ai_telemetry_card.dart            # Kartu distribusi probabilitas CNN (Organik/Plastik/Kertas)
│   └── screens/
│       ├── login_screen.dart                 # Layar masuk + 1-Klik Akun Demo + Konfigurasi URL API
│       ├── register_screen.dart              # Layar pendaftaran akun warga baru
│       ├── home_screen.dart                  # Beranda KPI personal, komposisi sampah, & navigasi bawah
│       ├── create_report_screen.dart         # Kamera/Galeri, Live AI Detection, Peta GPS, & Preview Sheet
│       ├── report_history_screen.dart        # Daftar riwayat dengan filter status/kategori & pencarian
│       └── report_detail_screen.dart         # Detail foto, peta + buka Google Maps, timeline, & Edit/Hapus
└── pubspec.yaml
```

---

## 2. Fitur Utama (Sesuai PRD Bagian 5B)

1. **Autentikasi & Persistensi Sesi:**
   - Login (`POST /api/auth/login`), Register (`POST /api/auth/register`), dan tombol **Akses Cepat Akun Demo (1-Klik)**.
   - Menyimpan `accessToken`, `refreshToken`, dan profil pengguna di `SharedPreferences` (`storage_service.dart`).
   - **Auto-Refresh Token:** Interceptor `Dio` pada `api_service.dart` otomatis memperbarui token melalui `POST /api/auth/refresh` saat menerima respons `401 Unauthorized`.
2. **Beranda & Statistik Personal (`home_screen.dart`):**
   - Menampilkan metrik KPI warga (`Total Laporan`, `Menunggu`, `Diproses`, `Selesai`), rincian kategori sampah (`Organik`, `Plastik`, `Kertas`), indikator mode *Offline*, daftar laporan terbaru, dan tombol aksi cepat **"Buat Laporan"**.
3. **Formulir Buat Laporan & Deteksi AI (`create_report_screen.dart`):**
   - Ambil foto dari **Kamera** atau **Galeri** (`image_picker`).
   - Mengirim foto secara otomatis ke `POST /api/ml/predict` dan menampilkan distribusi probabilitas 3 kelas (`organic`, `plastic`, `paper`) beserta skor *confidence* dan opsi koreksi manual.
   - Mendeteksi titik koordinat GPS perangkat (`geolocator`) dengan pratinjau peta interaktif (`flutter_map`) dan *reverse geocoding*.
   - Menampilkan **Modal Pratinjau (Preview Sheet)** sebelum mengirim laporan ke `POST /api/reports`.
4. **Riwayat & Detail Pelacakan (`report_history_screen.dart` & `report_detail_screen.dart`):**
   - Filter berdasarkan status (`Semua`, `Menunggu`, `Diproses`, `Selesai`, `Ditolak`), kategori sampah, pencarian kata kunci, dan *Pull-to-Refresh*.
   - Detail laporan menampilkan foto penuh, catatan petugas (`admin_notes`), peta lokasi + tombol **"Buka Google Maps"**, linimasa perubahan status (`report_logs`), serta fitur **Edit / Hapus** untuk laporan yang masih berstatus `pending`.

---

## 3. Cara Menjalankan Aplikasi Mobile

Pastikan server Unified Backend (`http://localhost:5001`) sudah aktif, kemudian jalankan:

```bash
cd mobile
flutter pub get

# Jalankan di Chrome (Web Mobile Frame)
flutter run -d chrome --web-port 8081

# Atau jalankan di Emulator / Perangkat Mobile
flutter run
```

> **Catatan Endpoint Emulator vs Perangkat Fisik vs Chrome:**
> - **Chrome (Flutter Web) / iOS Simulator / macOS:** Otomatis menggunakan `http://localhost:5001/api`
> - **Android Emulator:** Otomatis menggunakan `http://10.0.2.2:5001/api`
> - **Perangkat Fisik:** Ketuk ikon server di pojok kanan atas layar Login untuk memasukkan alamat IP lokal komputer Anda (misal `http://192.168.1.10:5001/api`).
