# 📊 Progress Tracker — Smart Waste Management System

Dokumen ini mencatat pengetahuan (*knowledge base*) dan status pengerjaan proyek secara *real-time*.

---

## 📌 Ringkasan Status Komponen

| Komponen | Bobot | Status | Progress |
|----------|-------|--------|----------|
| **1. Monorepo & Git Setup** | — | ✅ Selesai | 100% |
| **2. Database Design (Neon PostgreSQL + Prisma)** | 5% | ✅ Selesai | 100% |
| **3. Backend & API Integration (Express + TS + Embedded TFJS)** | 15% | ✅ Selesai | 100% |
| **4. Machine Learning (Dataset, Training, Evaluasi, Model `.h5`/TFJS)** | 20% | 🔄 Sebagian (API Inference Selesai) | 30% |
| **5. Website Development (Next.js 14+ App Router + Tailwind)** | 25% | ✅ Selesai | 100% |
| **6. Mobile Development (Flutter)** | 20% | ⏳ Belum Dimulai | 0% |
| **7. Code Quality, Dokumentasi (ERD, API Spec) & Polish** | 15% | 🔄 Sebagian (README awal) | 25% |

---

## ✅ Detail Bagian yang Sudah Selesai

### 1. Struktur Monorepo & Repository Git
- Repository Git telah diinisialisasi pada branch `main` dan terhubung ke remote: `https://github.com/nabssku/Smart-Waste-System.git`
- Struktur direktori lengkap (`web/`, `backend/`, `mobile/`, `ml/`, `docs/`), `.gitignore`, `README.md`, serta `.env.example`.
- Keputusan Arsitektur: **Opsi 2 — Unified Backend** (1 server Express.js yang menangani seluruh REST API sekaligus menjalankan inferensi Machine Learning secara langsung menggunakan `@tensorflow/tfjs` + `sharp`).

### 2. Database (Neon Serverless PostgreSQL + Prisma ORM)
- **File Schema:** `backend/src/prisma/schema.prisma`
- **Database Cloud:** Terhubung ke Neon PostgreSQL (`neondb` di region `ap-southeast-1`) menggunakan *connection pooling* (`DATABASE_URL`) dan *direct connection* (`DIRECT_URL`).
- **Tabel & Relasi:**
  - `users` (`id`, `name`, `email`, `password`, `role`, `avatar_url`, `phone`, `created_at`, `updated_at`)
  - `reports` (`id`, `user_id`, `title`, `description`, `image_url`, `latitude`, `longitude`, `address`, `waste_type`, `ai_confidence`, `status`, `admin_notes`, `created_at`, `updated_at`)
  - `report_logs` (`id`, `report_id`, `changed_by`, `old_status`, `new_status`, `notes`, `created_at`)
- **Seeder (`backend/src/prisma/seed.ts`):**
  - Akun Admin: `admin@smartwaste.id` / `Admin123!`
  - Akun User: `user@smartwaste.id` / `User123!`, `siti@smartwaste.id` / `User123!`, `budi@smartwaste.id` / `User123!`
  - 8 Laporan sampah sampel beserta log riwayat status dan gambar sampel otomatis di `backend/uploads/`.

### 3. Unified Backend & REST API (`backend/`)
- **Middleware (`backend/src/middleware/`):**
  - `auth.ts`: JWT Access Token & Refresh Token generator/verifier.
  - `rbac.ts`: Role-Based Access Control (`admin`, `user`).
  - `upload.ts`: Multer image upload (validasi JPG/PNG/WEBP, maks 5MB, mendukung field `image` maupun `file`).
  - `error.ts`: Penanganan error terpusat (MulterError, ZodError, general Error).
- **Endpoints yang Sudah Aktif (`http://localhost:5000`):**
  - **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`
  - **Reports:** `GET /api/reports` (pagination, filter status, waste_type, date range, keyword search), `GET /api/reports/my`, `GET /api/reports/:id`, `POST /api/reports` (auto AI detection), `PUT /api/reports/:id`, `PATCH /api/reports/:id/status` (auto insert `report_logs`), `DELETE /api/reports/:id`
  - **Users (Admin):** `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`
  - **Statistics:** `GET /api/stats/dashboard` (Admin global stats & data grafik), `GET /api/stats/my` (User personal stats)
  - **Machine Learning Inference:** `POST /api/ml/predict`, `POST /predict`, `GET /health`, `GET /api/health`

### 4. Website Frontend — Next.js 14 App Router (`web/`)
- **Core & Integrasi API (`web/lib/` & `web/middleware.ts`):**
  - `types.ts`, `utils.ts`, dan `api.ts` (lengkap dengan auto-refresh JWT token dan proxy `/uploads/*`).
  - Proteksi route berbasis cookie & role (`admin` vs `user`) di `web/middleware.ts` dan `AppShell.tsx`.
- **Halaman Publik & Autentikasi:**
  - Landing Page (`web/app/page.tsx`) dengan *Quick Demo Login* (1 klik masuk sebagai Admin atau Warga).
  - Login (`web/app/(auth)/login/page.tsx`) & Register (`web/app/(auth)/register/page.tsx`).
- **Admin Command Center (`web/app/admin/`):**
  - `/admin/dashboard`: Kartu ringkasan KPI, Pie Chart (Status), Bar Chart (Jenis Sampah), Line Chart (Tren 6 Bulan), Peta Sebaran Laporan (Leaflet), & tabel laporan terbaru.
  - `/admin/reports`: Tabel seluruh laporan dengan filter (status, jenis sampah, rentang tanggal, kata kunci), pagination, modal ubah status cepat, dan hapus laporan.
  - `/admin/reports/[id]`: Detail laporan lengkap (foto resolusi penuh, kartu telemetri AI, peta titik koordinat, form update status + *admin notes*, edit metadata, dan *audit log* riwayat status).
  - `/admin/users`: Manajemen pengguna (filter role, pencarian, edit profil/role/reset password, hapus pengguna).
- **Portal Warga Pelapor (`web/app/dashboard/`):**
  - `/dashboard`: Ringkasan statistik personal warga, komposisi jenis sampah, peta laporan pribadi, dan daftar laporan terbaru.
  - `/dashboard/create`: Form Buat Laporan Baru dengan **Live AI Classification Preview** (probabilitas `organic`, `plastic`, `paper`), konfirmasi/koreksi kategori manual, serta **Interactive Leaflet Geo-Pin Picker** + tombol GPS otomatis & Reverse Geocoding.
  - `/dashboard/reports` & `/dashboard/reports/[id]`: Riwayat laporan warga, filter status/jenis sampah, timeline pelacakan status, serta fitur edit/hapus untuk laporan berstatus *pending*.

---

## ⏳ Daftar Pekerjaan Selanjutnya (Remaining Tasks)

### A. Machine Learning Dataset, Training & Evaluasi (`ml/`) [Bobot 20%]
- [ ] Penyediaan dataset minimal 150 gambar (50 `organic`, 50 `plastic`, 50 `paper`) di `ml/dataset/`
- [ ] Notebook & Script Training (`ml/notebooks/training.ipynb` & `ml/train.py`) dengan Transfer Learning / CNN 224x224
- [ ] Export model ke `.h5` (`ml/models/waste_classifier.h5`) dan format TensorFlow.js (`ml/models/tfjs/model.json`)
- [ ] Evaluasi model (Target akurasi $\ge 80\%$): *Confusion Matrix* (`ml/evaluation/confusion_matrix.png`), *Classification Report*, dan *Training History Curve*

### C. Mobile Application — Flutter (`mobile/`) [Bobot 20%]
- [ ] Setup `pubspec.yaml` & arsitektur folder Flutter (`models`, `providers`, `screens`, `services`, `widgets`)
- [ ] Auth Screens (Login & Register + session persistence)
- [ ] Home Screen (statistik personal & daftar laporan terbaru)
- [ ] Buat Laporan Screen (ambil foto Kamera/Galeri, deteksi AI otomatis, ambil koordinat GPS, isi deskripsi, preview & submit)
- [ ] Riwayat & Detail Laporan Screen (filter status, timeline, pull-to-refresh)

### D. Dokumentasi Akhir (`docs/`) [Bobot 10%]
- [ ] Diagram ERD & file SQL/schema di `docs/`
- [ ] Dokumentasi API (Swagger / Postman Collection JSON di `docs/`)
