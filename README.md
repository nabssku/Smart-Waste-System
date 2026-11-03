# Smart Waste Management System

Sistem pengelolaan sampah berbasis teknologi yang memungkinkan pengguna melaporkan tumpukan sampah (foto + koordinat GPS + deskripsi), mengklasifikasikan jenis sampah secara otomatis menggunakan Machine Learning (Organic, Plastic, Paper), serta memfasilitasi admin dalam memantau dan menindaklanjuti laporan melalui dashboard terintegrasi.

---

## 🏗️ Arsitektur & Struktur Monorepo

```text
smart-waste/
├── web/                    # Next.js 14+ (App Router), TypeScript, Tailwind CSS
│   ├── app/
│   │   ├── (auth)/         # Halaman Login & Register
│   │   ├── dashboard/      # Dashboard User
│   │   ├── admin/          # Dashboard Admin, Manajemen User & Laporan
│   │   └── layout.tsx
│   ├── components/         # Reusable UI Components
│   └── lib/                # API Client & Auth Helpers
│
├── backend/                # Node.js + Express.js (TypeScript) + Prisma ORM
│   ├── src/
│   │   ├── controllers/    # Route Controllers
│   │   ├── middleware/     # Auth (JWT), RBAC, File Upload (Multer)
│   │   ├── routes/         # Express API Routes
│   │   ├── services/       # Business Logic & ML Proxy
│   │   ├── prisma/         # Prisma Schema, Migrations & Seed
│   │   └── app.ts          # Entry point aplikasi Express
│   └── uploads/            # Penyimpanan lokal file gambar laporan
│
├── mobile/                 # Aplikasi Mobile Flutter (Dart)
│   └── lib/
│       ├── models/         # Data Models
│       ├── providers/      # State Management
│       ├── screens/        # UI Screens (Auth, Home, Buat Laporan, Riwayat)
│       ├── services/       # API Service & Geolocator Service
│       ├── widgets/        # Custom Flutter Widgets
│       └── main.dart
│
├── ml/                     # Machine Learning Service (Python, TensorFlow, FastAPI)
│   ├── dataset/            # Dataset gambar (organic, plastic, paper)
│   ├── notebooks/          # Jupyter Notebook training & evaluasi
│   ├── models/             # Saved model (.h5 / SavedModel)
│   ├── api/                # FastAPI endpoint (/predict, /health)
│   ├── evaluation/         # Confusion matrix & classification report
│   └── requirements.txt
│
├── docs/                   # Dokumentasi ERD, API Spec (Swagger/Postman), Screenshots
└── PRD-Smart-Waste-Management.md
```

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend (Web)** | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| **Backend API** | Node.js, Express.js, TypeScript, JWT (Access + Refresh Token) |
| **Database & ORM** | PostgreSQL (Neon Serverless), Prisma ORM |
| **Mobile App** | Flutter (Dart) |
| **Machine Learning** | Python, TensorFlow/Keras (MobileNetV2), FastAPI |

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Database & Backend (`backend/`)
```bash
cd backend
cp .env.example .env
# Sesuaikan DATABASE_URL dengan connection string Neon PostgreSQL Anda
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 2. Machine Learning API (`ml/`)
```bash
cd ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

### 3. Website Frontend (`web/`)
```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

### 4. Mobile App (`mobile/`)
```bash
cd mobile
flutter pub get
flutter run
```

---

## 👥 Role & Akun Default (Seed)

| Role | Email | Password | Akses |
|------|-------|----------|-------|
| **Admin** | `admin@smartwaste.id` | `Admin123!` | Web Admin Dashboard |
| **User** | `user@smartwaste.id` | `User123!` | Web User Dashboard & Mobile App |
