# 📊 Knowledge Base & Progress Tracker — Smart Waste Management System

Dokumen ini menyimpan basis pengetahuan teknis (*knowledge base*), keputusan arsitektur, kredensial akun, konfigurasi *environment*, serta status pengerjaan proyek secara *real-time* (terakhir diperbarui: **4 November 2026**).

---

## 📌 Ringkasan Status Komponen

| Komponen | Bobot PRD | Status | Progress |
| :--- | :---: | :---: | :---: |
| **1. Monorepo & Git Setup (`main`)** | — | ✅ Selesai | **100%** |
| **2. Database Design (Neon PostgreSQL + Prisma ORM)** | 5% | ✅ Selesai | **100%** |
| **3. Backend & API Integration (Express + TS + Embedded TFJS)** | 15% | ✅ Selesai | **100%** |
| **4. Website Development (Next.js 14 App Router + Tailwind)** | 25% | ✅ Selesai | **100%** |
| **5. Machine Learning (Kaggle Dataset, CNN Training, Evaluasi)** | 20% | ✅ Selesai | **100%** |
| **6. Mobile Development (Flutter — Android, iOS, & Chrome Web)** | 20% | ✅ Selesai | **100%** |
| **7. Code Quality, Dokumentasi (`docs/` ERD, SQL, API Spec, Postman)** | 15% | ✅ Selesai | **100%** |

> **Total Penyelesaian Keseluruhan Proyek:** **100%** (Seluruh komponen aplikasi, model AI, aplikasi mobile, dan dokumentasi teknis di `docs/` telah rampung).

---

## 🔑 Informasi Penting & Konfigurasi Teknis (Knowledge Base)

### 1. Port & Layanan Aktif
- **Unified Backend Server (`backend/`):** Berjalan di **`http://localhost:5001`** (diubah dari port `5000` karena port `5000` di macOS digunakan oleh *ControlCenter / AirPlay Receiver*).
  - Base API URL: `http://localhost:5001/api`
  - Android Emulator API URL: `http://10.0.2.2:5001/api`
- **Website Frontend (`web/`):** Berjalan di **`http://localhost:3000`**
- **Mobile App di Chrome (`mobile/`):** Berjalan di **`http://localhost:8081`** (`flutter run -d chrome --web-port 8081`)
- **Repository GitHub:** `https://github.com/nabssku/Smart-Waste-System.git` (branch `main`)

### 2. Kredensial Akun Demo (Seeder Database)
- **Petugas / Admin:** `admin@smartwaste.id` / Password: `Admin123!`
- **Warga Pelapor 1:** `user@smartwaste.id` / Password: `User123!`
- **Warga Pelapor 2:** `siti@smartwaste.id` / Password: `User123!`
- **Warga Pelapor 3:** `budi@smartwaste.id` / Password: `User123!`

### 3. Sistem Desain Visual (*Municipal Public Works / Architectural Ledger*)
Digunakan secara konsisten di **Website (`web/`)** dan **Mobile App (`mobile/`)** untuk menghindari tampilan generik:
- **Tipografi:** `Familjen Grotesk` (Display/Heading), `Inter` (UI/Body), dan `Azeret Mono` (Telemetri AI, ID Laporan, Koordinat GPS, Metrik Tabel).
- **Palet Warna:**
  - *Stone Canvas Background:* `#F4F4F0`
  - *Pure Ledger Surface:* `#FFFFFF`
  - *Asphalt Primary Ink:* `#111315`
  - *Structural 1px Hairline Border:* `#DCDCD4`
  - *Civic Forest Green (Primary Action):* `#1E4D2B` (Tint: `#E8F0EA`)
  - *Semantic Status:* Pending (`#92400E` / `#FEF3C7`), In Progress (`#1E40AF` / `#DBEAFE`), Completed (`#166534` / `#DCFCE7`), Rejected (`#991B1B` / `#FEE2E2`).

---

## ✅ Detail Seluruh Modul yang Telah Selesai

### 1. Database (Neon Serverless PostgreSQL + Prisma ORM)
- **File Schema:** `backend/src/prisma/schema.prisma` & `docs/schema.sql`
- **Seeder:** `backend/src/prisma/seed.ts` (4 pengguna + 8 laporan sampel + riwayat `report_logs` + foto asli dari dataset Kaggle di `backend/uploads/sample-*.jpg`).
- **Tabel:** `users`, `reports`, dan `report_logs`.

### 2. Unified Backend & REST API (`backend/`)
- **Entry Point:** `backend/src/app.ts`
- **Middleware (`backend/src/middleware/`):** `auth.ts` (JWT Access & Refresh Token), `rbac.ts` (`admin` vs `user`), `upload.ts` (Multer JPG/PNG/WEBP maks 5MB), `error.ts`.
- **Service Inferensi ML (`backend/src/services/ml.service.ts`):** Memuat model CNN terlatih dari `ml/models/tfjs/model.json` + `weights.bin` secara *in-process* menggunakan `@tensorflow/tfjs` dan `sharp` (`224x224` RGB).
- **Endpoints:**
  - Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`
  - Reports: `GET /api/reports`, `GET /api/reports/my`, `GET /api/reports/:id`, `POST /api/reports`, `PUT /api/reports/:id`, `PATCH /api/reports/:id/status`, `DELETE /api/reports/:id`
  - Users (Admin): `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`
  - Statistics: `GET /api/stats/dashboard`, `GET /api/stats/my`
  - Machine Learning: `POST /api/ml/predict`, `POST /predict`, `GET /health`, `GET /api/health`

### 3. Website Frontend — Next.js 14 App Router (`web/`)
- **Seluruh rute halaman lulus `npm run build --prefix web` dan `tsc --noEmit`:**
  - Publik & Auth: `/`, `/login`, `/register`
  - Admin Command Center: `/admin/dashboard`, `/admin/reports`, `/admin/reports/[id]`, `/admin/users`
  - Portal Warga Pelapor: `/dashboard`, `/dashboard/create`, `/dashboard/reports`, `/dashboard/reports/[id]`
- **Komponen Utama:** `web/components/AppShell.tsx`, `web/components/Badges.tsx`, `web/components/WasteMap.tsx`, `web/components/ToastProvider.tsx`.

### 4. Machine Learning Dataset, Training & Evaluasi (`ml/`)
- **Sumber Dataset Resmi:** [Kaggle — Garbage Classification (`mostafaabla/garbage-classification`)](https://www.kaggle.com/datasets/mostafaabla/garbage-classification/data)
- **Jumlah & Struktur Dataset (`ml/dataset/`):**
  - Total **240 foto asli RGB (`224x224`)** — masing-masing **80 foto per kelas** (`organic`, `paper`, `plastic`).
  - **Pembagian Data (`ml/dataset/dataset_split.csv`):** **80% Training (`192` foto)** dan **20% Testing (`48` foto)** dengan augmentasi *horizontal flip*, *zoom crop rotate*, dan *brightness/contrast shift*.
- **Pipeline & Model (`ml/models/`, `ml/notebooks/`):**
  - Pipeline utama: `ml/build_dataset_and_train.ts`
  - Referensi Python & Notebook: `ml/train.py`, `ml/requirements.txt`, `ml/notebooks/waste_classification_training.ipynb`, `ml/README.md`
  - Artefak Model: `ml/models/waste_classifier.h5` & `ml/models/tfjs/model.json` + `weights.bin`
- **Hasil Evaluasi pada 20% Test Split (`ml/evaluation/`):**
  - **Test Accuracy:** **93.75%** (`45/48` tepat; melampaui target PRD $\ge 80\%$)
  - File Evaluasi: `ml/evaluation/confusion_matrix.png`, `ml/evaluation/training_history.png`, `ml/evaluation/classification_report.txt`, `ml/evaluation/evaluation_metrics.json`.

### 5. Mobile Application — Flutter (`mobile/`)
- **Konfigurasi & Tema:** `mobile/pubspec.yaml`, `mobile/analysis_options.yaml`, `mobile/lib/theme/app_theme.dart`, `mobile/lib/main.dart`, `mobile/README.md`, `AndroidManifest.xml`, `Info.plist`, `mobile/web/index.html`, `mobile/web/manifest.json`.
- **Models (`mobile/lib/models/`):** `user_model.dart`, `report_model.dart`.
- **Services (`mobile/lib/services/`):** `storage_service.dart` (`SharedPreferences`), `api_service.dart` (`Dio` + *auto-refresh token interceptor* pada `401`), `location_service.dart` (`Geolocator` GPS + Nominatim *reverse geocoding*).
- **Providers (`mobile/lib/providers/`):** `auth_provider.dart`, `report_provider.dart` (termasuk deteksi mode *Offline*).
- **Widgets & Screens (`mobile/lib/widgets/`, `mobile/lib/screens/`):**
  - `login_screen.dart` (termasuk 1-klik akun demo & dialog ubah URL API) & `register_screen.dart`
  - `home_screen.dart` (KPI personal, komposisi kategori sampah, laporan terbaru, & aksi cepat *"Buat Laporan"*)
  - `create_report_screen.dart` (Kamera/Galeri, **Live AI Detection (`POST /api/ml/predict`)** via `ai_telemetry_card.dart`, GPS & peta `flutter_map`, **Modal Pratinjau / Preview Sheet** sebelum *submit*, dan kirim ke `POST /api/reports`)
  - `report_history_screen.dart` & `report_detail_screen.dart` (filter status/kategori, pencarian, *pull-to-refresh*, peta + tombol **"Buka Google Maps"**, linimasa `report_logs`, serta fitur **Edit / Hapus** saat status `pending`).

### 6. Dokumentasi Teknis Proyek (`docs/`)
- **Diagram ERD & Spesifikasi Tabel:** [`docs/ERD.md`](docs/ERD.md)
- **Skema DDL SQL PostgreSQL:** [`docs/schema.sql`](docs/schema.sql)
- **Dokumentasi Spesifikasi REST API & ML:** [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md)
- **Koleksi Postman v2.1 Siap Impor:** [`docs/postman_collection.json`](docs/postman_collection.json)
- **Dokumentasi Root & Modul:** [`README.md`](README.md), [`ml/README.md`](ml/README.md), [`mobile/README.md`](mobile/README.md)
