# Smart Waste Management System

Sistem pengelolaan sampah perkotaan terpadu berbasis **Fullstack Web (Next.js 14)**, **Mobile App (Flutter)**, **Unified REST API Backend (Express + TypeScript + Prisma + PostgreSQL)**, dan **Machine Learning Image Classification (CNN `224x224` — Organic, Plastic, Paper)** yang memungkinkan warga melaporkan timbulan sampah lengkap dengan foto kamera/galeri, koordinat GPS, deteksi kategori AI otomatis, serta memfasilitasi petugas Dinas Lingkungan Hidup (Admin) dalam memantau dan menindaklanjuti laporan secara *real-time*.

---

## 🏗️ Arsitektur & Struktur Monorepo

```text
smart-waste/
├── web/                        # Website Frontend — Next.js 14 (App Router), TypeScript, Tailwind CSS
│   ├── app/
│   │   ├── login/ & register/  # Autentikasi JWT + 1-Klik Akun Demo
│   │   ├── dashboard/          # Portal Warga (Statistik, Buat Laporan + AI + Peta, Riwayat, Detail)
│   │   ├── admin/              # Command Center Admin (KPI, Grafik, Semua Laporan, Update Status, Users)
│   │   └── page.tsx            # Landing Page Sistem Pelaporan Publik
│   ├── components/             # AppShell, WasteMap (Leaflet), Badges, ToastProvider
│   └── lib/                    # Klien HTTP + Interceptor Auto-Refresh JWT
│
├── backend/                    # Unified Backend API & Embedded ML Inference (Port 5001)
│   ├── src/
│   │   ├── controllers/        # Auth, Reports CRUD, Users, Statistics, & ML Predict
│   │   ├── middleware/         # JWT Auth, RBAC (admin/user), Multer Upload (5MB), Error Handler
│   │   ├── routes/             # Definisi Rute REST API (/api/* & /predict)
│   │   ├── services/           # In-Process TensorFlow.js CNN Classifier (224x224 RGB)
│   │   ├── prisma/             # schema.prisma (Neon PostgreSQL) & seed.ts
│   │   └── app.ts              # Entry point Express Server
│   └── uploads/                # Penyimpanan foto bukti laporan sampah
│
├── mobile/                     # Aplikasi Mobile Warga — Flutter (Android, iOS, & Chrome Web)
│   ├── lib/
│   │   ├── models/             # UserModel, ReportModel, ReportLogModel, MlPredictionResult
│   │   ├── providers/          # AuthProvider & ReportProvider (State Management + Offline Indicator)
│   │   ├── screens/            # Login, Register, Home, CreateReport (Kamera/GPS/AI), History, Detail
│   │   ├── services/           # ApiService (Dio + Auto-Refresh 401), LocationService, StorageService
│   │   ├── widgets/            # StatusBadge, ReportCard, AiTelemetryCard
│   │   ├── theme/              # Sistem Desain Municipal Ledger (app_theme.dart)
│   │   └── main.dart           # Entry point MultiProvider & Responsive Mobile Viewport Frame
│   └── pubspec.yaml
│
├── ml/                         # Machine Learning Dataset, CNN Training, & Evaluasi
│   ├── dataset/                # 240 foto asli Kaggle (80 organic, 80 plastic, 80 paper) + dataset_split.csv
│   ├── models/                 # Model terlatih (.h5 & TensorFlow.js model.json + weights.bin)
│   ├── evaluation/             # Confusion matrix, kurva akurasi/loss, & classification report (Akurasi 93.75%)
│   ├── notebooks/              # Jupyter Notebook pelatihan & evaluasi (waste_classification_training.ipynb)
│   ├── train.py                # Skrip pelatihan Transfer Learning MobileNetV2 (Python/Keras)
│   └── build_dataset_and_train.ts
│
├── docs/                       # Dokumentasi Teknis Lengkap
│   ├── ERD.md                  # Diagram Entity-Relationship (Mermaid & ASCII) + Spesifikasi Tabel
│   ├── schema.sql              # Skrip DDL PostgreSQL lengkap (ENUM, TABLE, FOREIGN KEY, INDEX)
│   ├── API_SPECIFICATION.md    # Dokumentasi lengkap seluruh endpoint REST API & ML Predict
│   └── postman_collection.json # Koleksi Postman v2.1 siap impor beserta auto-save token JWT
│
├── PRD-Smart-Waste-Management.md
└── PROGRESS.md
```

---

## 🛠️ Tech Stack & Keputusan Teknis

| Layer | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Website Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, React-Leaflet | Portal warga & Admin Command Center responsif dengan peta interaktif OpenStreetMap. |
| **Mobile Application** | Flutter 3.x (Dart), Provider, Dio, Geolocator, Image Picker, Flutter Map | Mendukung Android, iOS, dan **Chrome Web (`flutter run -d chrome`)** dengan bingkai layar HP otomatis. |
| **Unified Backend API** | Node.js, Express.js, TypeScript, Zod, Multer, Express Rate Limit | REST API terpusat dengan autentikasi JWT (Access + Refresh Token) dan otorisasi RBAC. |
| **Database & ORM** | PostgreSQL (Neon Serverless), Prisma ORM | Skema relasional (`users`, `reports`, `report_logs`) dengan *cascade integrity* & *indexing*. |
| **Machine Learning** | TensorFlow / Keras & `@tensorflow/tfjs` + `sharp` (`224x224` RGB) | Klasifikasi 3 kelas sampah (`organic`, `plastic`, `paper`) dengan **Test Accuracy 93.75%** (target PRD $\ge 80\%$). |

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Unified Backend & Database (`backend/` — Port `5001`)
```bash
cd backend
cp .env.example .env
# Pastikan DATABASE_URL & DIRECT_URL di .env mengarah ke PostgreSQL Anda
npm install
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma db push --schema=src/prisma/schema.prisma
npm run prisma:seed
npm run dev
```
> Server Backend & ML Inference aktif di **`http://localhost:5001`** (Health check: `http://localhost:5001/health`).

### 2. Website Frontend (`web/` — Port `3000`)
```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```
> Buka **`http://localhost:3000`** di browser untuk mengakses Landing Page, Portal Warga, atau Dashboard Admin.

### 3. Aplikasi Mobile Flutter (`mobile/` — Chrome Web / Android / iOS)
```bash
cd mobile
flutter pub get

# Menjalankan langsung di Google Chrome (dengan bingkai layar HP):
flutter run -d chrome --web-port 8081

# Atau menjalankan di Android Emulator / iOS Simulator / Perangkat Fisik:
flutter run
```

### 4. Machine Learning Dataset & Evaluasi (`ml/`)
Dataset resmi diambil dari **Kaggle (`mostafaabla/garbage-classification`)** berjumlah **240 citra RGB (`224x224`)** yang dibagi menjadi **80% Training (`192` foto)** dan **20% Testing (`48` foto)**.
```bash
# Menjalankan ulang pipeline kompilasi dataset, training CNN, & evaluasi metrik:
npx --prefix backend tsx ml/build_dataset_and_train.ts
```
Hasil evaluasi lengkap tersedia di folder [`ml/evaluation/`](ml/evaluation/):
- **Test Accuracy:** **93.75%** (`45/48` sampel uji tepat)
- **Macro F1-Score:** **93.73%**
- Visualisasi: [`confusion_matrix.png`](ml/evaluation/confusion_matrix.png), [`training_history.png`](ml/evaluation/training_history.png), dan [`classification_report.txt`](ml/evaluation/classification_report.txt).

---

## 👥 Akun Demo Bawaan (Database Seeder)

| Peran (Role) | Email | Password | Akses Platform |
| :--- | :--- | :--- | :--- |
| **Admin Dinas LH** | `admin@smartwaste.id` | `Admin123!` | Website Admin Dashboard (`/admin/dashboard`) |
| **Warga Pelapor 1** | `user@smartwaste.id` | `User123!` | Website User Dashboard (`/dashboard`) & Aplikasi Mobile Flutter |
| **Warga Pelapor 2** | `siti@smartwaste.id` | `User123!` | Website User Dashboard & Aplikasi Mobile Flutter |
| **Warga Pelapor 3** | `budi@smartwaste.id` | `User123!` | Website User Dashboard & Aplikasi Mobile Flutter |

---

## 📚 Dokumentasi Teknis (`docs/`)

1. **[Diagram ERD & Spesifikasi Database (`docs/ERD.md`)](docs/ERD.md)** — Diagram relasi tabel `users`, `reports`, dan `report_logs` beserta penjelasan indeks dan tipe ENUM.
2. **[Skrip DDL SQL PostgreSQL (`docs/schema.sql`)](docs/schema.sql)** — Skrip SQL murni untuk membuat seluruh tipe ENUM, tabel, *foreign key*, dan indeks.
3. **[Spesifikasi REST API & ML (`docs/API_SPECIFICATION.md`)](docs/API_SPECIFICATION.md)** — Daftar lengkap 18 endpoint beserta parameter, contoh *request*, dan contoh *response* JSON.
4. **[Koleksi Postman (`docs/postman_collection.json`)](docs/postman_collection.json)** — Koleksi Postman v2.1 siap impor untuk menguji seluruh endpoint secara langsung.
5. **[Dokumentasi Modul Machine Learning (`ml/README.md`)](ml/README.md)** — Penjelasan arsitektur CNN, sumber dataset Kaggle, augmentasi, dan metrik evaluasi.
6. **[Dokumentasi Modul Mobile Flutter (`mobile/README.md`)](mobile/README.md)** — Panduan struktur kode Flutter, fitur lapangan, dan konfigurasi endpoint.
