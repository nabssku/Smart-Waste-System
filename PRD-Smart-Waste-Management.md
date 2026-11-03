# 📋 PRD — Smart Waste Management System
### Technical Assessment — Bilcode Technology (Fullstack Developer)

---

## 1. Project Overview & Objectives

| Item | Detail |
|------|--------|
| **Project** | Smart Waste Management System |
| **Tipe** | Technical Coding Test — Take Home Project |
| **Posisi** | Fullstack Developer |
| **Deadline** | 5 hari kalender sejak email diterima |
| **Pengerjaan** | Individual |
| **Target Lulus** | Skor ≥ 75/100 |

### Deskripsi Singkat
Sistem pengelolaan sampah berbasis teknologi yang memungkinkan user melaporkan sampah (foto + GPS + deskripsi), AI mengklasifikasi jenis sampah, dan admin mengelola laporan melalui web dashboard. Terdiri dari 3 komponen utama: **Website**, **Mobile App**, dan **ML Model + REST API**.

### Scoring Weight (Prioritas Pengerjaan)
| Komponen | Bobot | Prioritas |
|----------|-------|-----------|
| Website Development | 25% | 🔴 Highest |
| Mobile Development | 20% | 🟠 High |
| Machine Learning | 20% | 🟠 High |
| Backend & API Integration | 15% | 🟡 Medium |
| Code Quality & Documentation | 10% | 🟡 Medium |
| Database Design | 5% | 🟢 Low |
| UI/UX | 5% | 🟢 Low |

---

## 2. User Roles & RBAC Matrix

### Roles
| Role | Platform | Deskripsi |
|------|----------|-----------|
| **Admin** | Website | Mengelola seluruh laporan, manajemen pengguna, dashboard statistik |
| **User** | Website + Mobile | Membuat laporan sampah, melihat riwayat & status laporan |

### RBAC Matrix
| Feature | Admin | User |
|---------|-------|------|
| Login/Auth | ✅ | ✅ |
| Register | ❌ (seeded) | ✅ |
| Dashboard Statistik | ✅ (full) | ✅ (personal) |
| Buat Laporan | ❌ | ✅ |
| Lihat Semua Laporan | ✅ | ❌ |
| Lihat Laporan Sendiri | — | ✅ |
| Update Status Laporan | ✅ | ❌ |
| CRUD Laporan (edit/delete) | ✅ | ✅ (own only) |
| Filter & Pencarian | ✅ | ✅ (own scope) |
| Manajemen Pengguna | ✅ | ❌ |
| AI Image Detection | — | ✅ (saat buat laporan) |

---

## 3. Fullstack Architecture & Tech Stack

### Tech Stack
| Layer | Teknologi |
|-------|-----------|
| **Frontend (Web)** | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| **Backend API** | Node.js + Express.js, TypeScript |
| **Mobile** | Flutter (Dart) |
| **Machine Learning** | Python 3.10+, TensorFlow/Keras, FastAPI |
| **Database** | PostgreSQL |
| **ORM** | Prisma (Node.js) |
| **Auth** | JWT (Access + Refresh Token) |
| **File Storage** | Local storage / Cloudinary (upload foto) |
| **Version Control** | Git & GitHub |

### Architecture Diagram (High-Level)

```
┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │     │  Flutter Mobile  │
│   (Admin+User)  │     │    (User)        │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │ REST API
              ┌──────▼──────┐
              │  Express.js  │
              │  Backend API │
              └──────┬──────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
   ┌─────▼─────┐ ┌──▼───┐ ┌────▼─────┐
   │ PostgreSQL │ │ File │ │ FastAPI  │
   │  Database  │ │ Store│ │ ML API   │
   └───────────┘ └──────┘ └────┬─────┘
                                │
                          ┌─────▼─────┐
                          │ TensorFlow│
                          │   Model   │
                          └───────────┘
```

### Folder Structure (Monorepo)
```
smart-waste-management/
├── web/                    # Next.js frontend
│   ├── app/
│   │   ├── (auth)/         # Login, Register pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── admin/          # Admin dashboard, user mgmt, reports
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/                # API client, auth helpers
│   └── package.json
│
├── backend/                # Express.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/      # auth.ts, rbac.ts, upload.ts
│   │   ├── routes/
│   │   ├── services/
│   │   ├── prisma/          # schema.prisma, migrations
│   │   └── app.ts
│   └── package.json
│
├── mobile/                 # Flutter app
│   ├── lib/
│   │   ├── models/
│   │   ├── providers/       # State management
│   │   ├── screens/
│   │   ├── services/        # API service, location service
│   │   ├── widgets/
│   │   └── main.dart
│   └── pubspec.yaml
│
├── ml/                     # Machine Learning
│   ├── dataset/
│   │   ├── organic/
│   │   ├── plastic/
│   │   └── paper/
│   ├── notebooks/
│   │   └── training.ipynb
│   ├── models/              # Saved model (.h5 / SavedModel)
│   ├── api/
│   │   └── main.py          # FastAPI prediction endpoint
│   ├── requirements.txt
│   └── evaluation/          # Reports, confusion matrix
│
├── docs/                   # ERD, API docs, screenshots
├── docker-compose.yml      # (opsional) untuk demo
└── README.md
```

---

## 4. Database Design (ERD)

### Tables

#### `users`
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK, auto-generate |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL, hashed (bcrypt) |
| role | ENUM('admin', 'user') | DEFAULT 'user' |
| avatar_url | VARCHAR(500) | NULLABLE |
| phone | VARCHAR(20) | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | ON UPDATE |

#### `reports` (laporan sampah)
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK, auto-generate |
| user_id | UUID | FK → users.id |
| title | VARCHAR(200) | NOT NULL |
| description | TEXT | NOT NULL |
| image_url | VARCHAR(500) | NOT NULL |
| latitude | DECIMAL(10,8) | NOT NULL |
| longitude | DECIMAL(11,8) | NOT NULL |
| address | TEXT | NULLABLE (reverse geocode) |
| waste_type | ENUM('organic', 'plastic', 'paper', 'unknown') | DEFAULT 'unknown' |
| ai_confidence | FLOAT | NULLABLE (confidence score dari ML) |
| status | ENUM('pending', 'in_progress', 'completed', 'rejected') | DEFAULT 'pending' |
| admin_notes | TEXT | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | ON UPDATE |

#### `report_logs` (history status changes)
| Column | Type | Constraint |
|--------|------|------------|
| id | UUID | PK |
| report_id | UUID | FK → reports.id |
| changed_by | UUID | FK → users.id |
| old_status | ENUM | NOT NULL |
| new_status | ENUM | NOT NULL |
| notes | TEXT | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Relasi
```
users (1) ──── (N) reports
reports (1) ──── (N) report_logs
users (1) ──── (N) report_logs (changed_by)
```

---

## 5. Core Features & Scope

### A. Website Development (25%) — Next.js

#### Auth & Security
- [ ] Login page dengan email + password
- [ ] JWT-based authentication (access token + refresh token)
- [ ] Route protection berdasarkan role (middleware Next.js)
- [ ] Redirect otomatis: admin → `/admin/dashboard`, user → `/dashboard`

#### Admin Dashboard
- [ ] Statistik overview: total laporan, laporan per status (pie chart), laporan per kategori sampah (bar chart), laporan per bulan (line chart)
- [ ] Tabel semua laporan dengan pagination
- [ ] Filter laporan: status, waste_type, date range, keyword search
- [ ] Detail laporan: foto, lokasi (embed map), deskripsi, AI classification result
- [ ] Update status laporan (Pending → In Progress → Completed / Rejected) + admin notes
- [ ] Manajemen pengguna: list user, lihat detail, (opsional) ban/activate

#### User Dashboard (Web)
- [ ] Statistik personal: total laporan saya, breakdown per status
- [ ] Buat laporan baru: upload foto, isi deskripsi, pilih lokasi (map picker)
- [ ] AI detection terintegrasi saat upload foto (preview klasifikasi)
- [ ] Riwayat laporan sendiri dengan filter & search
- [ ] Detail laporan + tracking status

#### UI/UX
- [ ] Responsive design (mobile-first)
- [ ] Clean & modern UI dengan Tailwind CSS
- [ ] Loading states, error handling, toast notifications
- [ ] Dark/Light mode (nice to have)

### B. Mobile Application (20%) — Flutter

#### Auth
- [ ] Register screen (name, email, password)
- [ ] Login screen (email + password)
- [ ] Persist session (shared preferences / secure storage)

#### User Dashboard
- [ ] Home screen: statistik ringkas + laporan terbaru
- [ ] Quick action button: "Buat Laporan"

#### Buat Laporan
- [ ] Capture foto dari kamera atau pilih dari galeri
- [ ] **AI Image Detection**: kirim foto ke ML API → tampilkan klasifikasi + confidence
- [ ] Auto-detect lokasi GPS (geolocator package)
- [ ] Input deskripsi
- [ ] Preview sebelum submit
- [ ] Submit laporan ke backend API

#### Riwayat & Status
- [ ] List laporan user dengan filter status
- [ ] Detail laporan: foto, lokasi (Google Maps), status, timeline
- [ ] Pull-to-refresh

#### Integrasi API
- [ ] HTTP client (dio / http package)
- [ ] Token management (auto-refresh)
- [ ] Error handling & offline state indicator

### C. Machine Learning (20%) — Python + TensorFlow/Keras

#### Dataset
- [ ] Minimal 150 gambar (50 per kategori)
- [ ] 3 kategori: **Organic Waste**, **Plastic Waste**, **Paper Waste**
- [ ] Sumber: Kaggle / Google Images / custom collection
- [ ] Split: 80% training, 20% testing
- [ ] Augmentasi data: rotation, flip, zoom, brightness (meningkatkan akurasi)

#### Model Training
- [ ] CNN architecture (Transfer Learning recommended: MobileNetV2 / EfficientNet untuk ringan & akurasi tinggi)
- [ ] Framework: TensorFlow/Keras
- [ ] Input size: 224x224 RGB
- [ ] Training dengan early stopping & learning rate scheduler
- [ ] Save model dalam format `.h5` dan/atau `SavedModel`

#### Evaluasi
- [ ] **Target akurasi: ≥ 80%** pada data testing
- [ ] Confusion Matrix (visualisasi matplotlib/seaborn)
- [ ] Classification Report (precision, recall, f1-score per kelas)
- [ ] Training history plot (accuracy & loss curve)

#### REST API (FastAPI)
- [ ] `POST /predict` — upload gambar, return klasifikasi + confidence score
- [ ] Response format:
```json
{
  "prediction": "plastic",
  "confidence": 0.94,
  "all_predictions": {
    "organic": 0.03,
    "plastic": 0.94,
    "paper": 0.03
  }
}
```
- [ ] Input validation (file type, file size)
- [ ] CORS enabled
- [ ] Health check endpoint: `GET /health`

### D. Backend & API Integration (15%) — Express.js

#### API Endpoints

**Auth**
| Method | Endpoint | Access | Deskripsi |
|--------|----------|--------|-----------|
| POST | `/api/auth/register` | Public | Register user baru |
| POST | `/api/auth/login` | Public | Login, return JWT |
| POST | `/api/auth/refresh` | Auth | Refresh access token |
| GET | `/api/auth/me` | Auth | Get current user profile |

**Reports**
| Method | Endpoint | Access | Deskripsi |
|--------|----------|--------|-----------|
| GET | `/api/reports` | Admin | Get semua laporan (pagination, filter) |
| GET | `/api/reports/my` | User | Get laporan milik user |
| GET | `/api/reports/:id` | Auth | Get detail laporan |
| POST | `/api/reports` | User | Buat laporan baru (multipart) |
| PUT | `/api/reports/:id` | Admin/Owner | Update laporan |
| PATCH | `/api/reports/:id/status` | Admin | Update status laporan |
| DELETE | `/api/reports/:id` | Admin/Owner | Hapus laporan |

**Users (Admin)**
| Method | Endpoint | Access | Deskripsi |
|--------|----------|--------|-----------|
| GET | `/api/users` | Admin | List semua user |
| GET | `/api/users/:id` | Admin | Detail user |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

**Statistics**
| Method | Endpoint | Access | Deskripsi |
|--------|----------|--------|-----------|
| GET | `/api/stats/dashboard` | Admin | Statistik global |
| GET | `/api/stats/my` | User | Statistik personal |

**ML Proxy** (opsional, backend proxy ke FastAPI)
| Method | Endpoint | Access | Deskripsi |
|--------|----------|--------|-----------|
| POST | `/api/ml/predict` | Auth | Proxy prediksi ke FastAPI ML |

#### Middleware Stack
1. **CORS** — whitelist frontend origins
2. **Rate Limiter** — prevent abuse
3. **Auth Middleware** — verify JWT, attach user to request
4. **RBAC Middleware** — check role permission
5. **Upload Middleware** — multer, file validation (image only, max 5MB)
6. **Error Handler** — centralized error response

---

## 6. Task Breakdown & Roadmap (5 Hari)

### Hari 1 — Foundation (Backend + DB + ML Start)
| Task | Estimasi |
|------|----------|
| Setup monorepo, Git init, README skeleton | 30 menit |
| Setup PostgreSQL + Prisma schema + migration | 1 jam |
| Express.js boilerplate + auth endpoints (register/login/JWT) | 2 jam |
| RBAC middleware | 1 jam |
| Reports CRUD API | 2 jam |
| Mulai kumpulkan dataset ML (Kaggle download) | 1 jam |
| **Total** | **~7.5 jam** |

### Hari 2 — ML Model + FastAPI
| Task | Estimasi |
|------|----------|
| Dataset preparation & augmentation | 1.5 jam |
| Model training (Transfer Learning MobileNetV2) | 2 jam |
| Evaluasi: accuracy, confusion matrix, classification report | 1 jam |
| FastAPI prediction endpoint | 1.5 jam |
| Test API prediksi end-to-end | 1 jam |
| Stats API endpoints | 1 jam |
| **Total** | **~8 jam** |

### Hari 3 — Website (Next.js)
| Task | Estimasi |
|------|----------|
| Next.js boilerplate + Tailwind setup | 30 menit |
| Auth pages (Login, Register) + JWT integration | 2 jam |
| Admin Dashboard (stats charts + laporan table) | 3 jam |
| Admin: filter, search, pagination | 1.5 jam |
| Admin: update status, detail laporan, manajemen user | 2 jam |
| **Total** | **~9 jam** |

### Hari 4 — Mobile (Flutter) + User Web
| Task | Estimasi |
|------|----------|
| Flutter boilerplate + auth screens | 1.5 jam |
| User dashboard + buat laporan (kamera, GPS, deskripsi) | 3 jam |
| AI Image Detection integration | 1.5 jam |
| Riwayat laporan + detail | 1.5 jam |
| User web dashboard (buat laporan, riwayat, stats personal) | 2 jam |
| **Total** | **~9.5 jam** |

### Hari 5 — Polish, Documentation, Deploy
| Task | Estimasi |
|------|----------|
| Responsive design polish (web) | 1.5 jam |
| Bug fixes & edge cases | 1.5 jam |
| ERD diagram (draw.io / dbdiagram.io) | 30 menit |
| API documentation (Postman collection / Swagger) | 1 jam |
| README lengkap (instalasi, env, cara pakai) | 1 jam |
| Deploy web (Vercel / Railway) | 1 jam |
| Build APK Flutter | 30 menit |
| Record video demo (max 10 menit) | 1.5 jam |
| Final review & submit | 30 menit |
| **Total** | **~9 jam** |

---

## 7. Deliverables Checklist

| # | Deliverable | Format |
|---|-------------|--------|
| 1 | GitHub Repository (monorepo) | Public/Private repo link |
| 2 | Link demo website | Vercel / Railway URL |
| 3 | APK Mobile | `.apk` file / Google Drive link |
| 4 | Dokumentasi API | Swagger / Postman collection |
| 5 | Database Schema / ERD | Image + `.sql` / Prisma schema |
| 6 | Source code ML + Model | Di folder `ml/` repo |
| 7 | Dataset + sumber | Di folder `ml/dataset/` + credit |
| 8 | Evaluasi model | Accuracy, confusion matrix, report |
| 9 | README | Panduan instalasi & penggunaan |
| 10 | Video demo | Max 10 menit, YouTube/Google Drive |

---

## 8. Key Technical Decisions & Rationale

| Keputusan | Alasan |
|-----------|--------|
| **MobileNetV2 (Transfer Learning)** | Ringan, cepat training, akurasi tinggi untuk image classification. Cocok untuk deploy di API server tanpa GPU besar |
| **JWT (Access + Refresh)** | Stateless auth, scalable, cocok untuk multi-client (web + mobile) |
| **Prisma ORM** | Type-safe, auto-generate types, migration management built-in |
| **Monorepo structure** | Satu repo = mudah dinilai assessor, dependency management jelas |
| **FastAPI terpisah** | ML service isolated, bisa scale independen, Python ecosystem TensorFlow |
| **PostgreSQL** | Robust, mendukung ENUM natively, cocok untuk production |

---

## 9. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Akurasi ML < 80% | Gagal requirement | Transfer learning + augmentasi data agresif. Dataset > 150 gambar jika perlu |
| Waktu tidak cukup (5 hari) | Incomplete deliverables | Prioritaskan by scoring weight. Web (25%) dan ML (20%) dulu |
| Flutter build issue | APK gagal | Test build APK sejak hari 3, jangan tunggu hari 5 |
| Deploy masalah | Tidak ada demo link | Siapkan backup: Railway free tier / local demo di video |

---

## 10. Success Criteria

- ✅ Website fully functional: auth (role-based), dashboard stats, CRUD laporan, filter/search, responsive
- ✅ Mobile app: register/login, buat laporan (foto + GPS + deskripsi), AI detection, riwayat
- ✅ ML model accuracy ≥ 80%, confusion matrix & classification report tersedia
- ✅ FastAPI prediction endpoint working
- ✅ Semua API endpoint terintegrasi (web ↔ backend ↔ mobile)
- ✅ Clean code, proper documentation, README lengkap
- ✅ Video demo ≤ 10 menit menjelaskan arsitektur + fitur
- ✅ **Target: Score ≥ 75/100**

---

*PRD ini disusun berdasarkan requirement Technical Assessment Bilcode Technology.*
*Last updated: November 2026*
