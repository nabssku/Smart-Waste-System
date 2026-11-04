# Spesifikasi REST API & Inferensi Machine Learning
## Smart Waste Management System

Dokumen ini memuat spesifikasi teknis seluruh endpoint REST API dan layanan klasifikasi citra AI CNN pada **Unified Backend Server** (`backend/src/app.ts`).

- **Base URL (Lokal / Web / iOS / Chrome):** `http://localhost:5001`
- **Base API Prefix:** `http://localhost:5001/api`
- **Base URL (Android Emulator):** `http://10.0.2.2:5001/api`
- **Autentikasi:** `Bearer <accessToken>` (JWT) pada header `Authorization`
- **Format Pertukaran Data:** `application/json` dan `multipart/form-data` (untuk unggah foto maksimal `5 MB`, format `.jpg`, `.jpeg`, `.png`, `.webp`)

---

## Ringkasan Daftar Endpoint

| Grup | Method | Endpoint | Akses RBAC | Deskripsi |
| :--- | :---: | :--- | :---: | :--- |
| **Health** | `GET` | `/health` (atau `/api/health`) | Public | Status layanan server & engine ML |
| **Auth** | `POST` | `/api/auth/register` | Public | Registrasi akun warga baru |
| **Auth** | `POST` | `/api/auth/login` | Public | Login & terbitkan Access + Refresh Token |
| **Auth** | `POST` | `/api/auth/refresh` | Public/Auth | Perbarui pasangan token JWT |
| **Auth** | `GET` | `/api/auth/me` | Auth (`admin`/`user`) | Profil pengguna yang sedang login |
| **ML AI** | `POST` | `/api/ml/predict` (atau `/predict`) | Public/Auth | Klasifikasi foto sampah dengan CNN (`224x224`) |
| **Reports** | `GET` | `/api/reports` | `admin` | Daftar semua laporan (paginasi, filter, cari) |
| **Reports** | `GET` | `/api/reports/my` | `user`/`admin` | Daftar laporan milik pengguna sendiri |
| **Reports** | `GET` | `/api/reports/:id` | `admin`/Owner | Detail laporan beserta riwayat `report_logs` |
| **Reports** | `POST` | `/api/reports` | `user`/`admin` | Buat laporan sampah baru (`multipart/form-data`) |
| **Reports** | `PUT` | `/api/reports/:id` | `admin`/Owner | Perbarui data laporan sampah |
| **Reports** | `PATCH` | `/api/reports/:id/status` | `admin` | Ubah status laporan & catat audit log |
| **Reports** | `DELETE` | `/api/reports/:id` | `admin`/Owner | Hapus laporan sampah |
| **Users** | `GET` | `/api/users` | `admin` | Daftar seluruh pengguna terdaftar |
| **Users** | `GET` | `/api/users/:id` | `admin` | Detail pengguna beserta laporan terbarunya |
| **Users** | `PUT` | `/api/users/:id` | `admin` | Perbarui profil atau peran pengguna |
| **Users** | `DELETE` | `/api/users/:id` | `admin` | Hapus akun pengguna |
| **Stats** | `GET` | `/api/stats/dashboard` | `admin` | Statistik global untuk Admin Dashboard |
| **Stats** | `GET` | `/api/stats/my` | `user`/`admin` | Statistik personal untuk Beranda Warga |

---

## 1. Autentikasi (`/api/auth`)

### 1.1. Registrasi Pengguna Baru
- **Endpoint:** `POST /api/auth/register`
- **Akses:** Public
- **Request Body (`application/json`):**
```json
{
  "name": "Andi Pratama",
  "email": "andi@smartwaste.id",
  "password": "User123!",
  "phone": "081234567890"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Andi Pratama",
      "email": "andi@smartwaste.id",
      "role": "user",
      "phone": "081234567890",
      "avatarUrl": null,
      "createdAt": "2026-11-04T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.2. Login Pengguna / Admin
- **Endpoint:** `POST /api/auth/login`
- **Akses:** Public
- **Akun Default (Seed):**
  - Admin: `admin@smartwaste.id` / `Admin123!`
  - User: `user@smartwaste.id` / `User123!`
- **Request Body (`application/json`):**
```json
{
  "email": "user@smartwaste.id",
  "password": "User123!"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "name": "Warga Pelapor Utama",
      "email": "user@smartwaste.id",
      "role": "user",
      "phone": "081298765432",
      "avatarUrl": null,
      "createdAt": "2026-11-03T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.3. Refresh Access Token
- **Endpoint:** `POST /api/auth/refresh`
- **Request Body (`application/json`):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.4. Ambil Profil Pengguna Aktif
- **Endpoint:** `GET /api/auth/me`
- **Header:** `Authorization: Bearer <accessToken>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "name": "Warga Pelapor Utama",
    "email": "user@smartwaste.id",
    "role": "user",
    "phone": "081298765432",
    "avatarUrl": null,
    "createdAt": "2026-11-03T12:00:00.000Z",
    "updatedAt": "2026-11-03T12:00:00.000Z"
  }
}
```

---

## 2. Klasifikasi Sampah AI CNN (`/api/ml/predict` & `/predict`)

### 2.1. Prediksi Kategori Sampah dari Foto
- **Endpoint:** `POST /api/ml/predict` (alias langsung: `POST /predict` sesuai PRD Bagian 5C)
- **Content-Type:** `multipart/form-data`
- **Form Field:** `image` (atau `file`) — File gambar `.jpg`, `.jpeg`, `.png`, `.webp` (maks. `5 MB`)
- **Contoh cURL:**
```bash
curl -X POST http://localhost:5001/api/ml/predict \
  -F "image=@ml/dataset/plastic/plastic_001.jpg"
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "prediction": "plastic",
  "confidence": 0.9412,
  "all_predictions": {
    "organic": 0.0315,
    "plastic": 0.9412,
    "paper": 0.0273
  },
  "image_url": "/uploads/waste-1730718000000-123456789.jpg",
  "data": {
    "prediction": "plastic",
    "confidence": 0.9412,
    "all_predictions": {
      "organic": 0.0315,
      "plastic": 0.9412,
      "paper": 0.0273
    },
    "imageUrl": "/uploads/waste-1730718000000-123456789.jpg",
    "engine": "tfjs-cnn-224x224"
  }
}
```

### 2.2. Health Check Server & ML Engine
- **Endpoint:** `GET /health` (atau `GET /api/health`)
- **Response `200 OK`:**
```json
{
  "status": "ok",
  "service": "smart-waste-unified-backend-ml",
  "timestamp": "2026-11-04T12:00:00.000Z"
}
```

---

## 3. Manajemen Laporan Sampah (`/api/reports`)

### 3.1. Daftar Semua Laporan (Khusus Admin)
- **Endpoint:** `GET /api/reports`
- **Akses:** `admin`
- **Query Parameters (Opsional):**
  - `page` (default: `1`), `limit` (default: `10`, maks: `100`)
  - `status`: `pending` | `in_progress` | `completed` | `rejected`
  - `waste_type` (atau `wasteType`): `organic` | `plastic` | `paper` | `unknown`
  - `search`: Kata kunci pada judul, deskripsi, alamat, atau nama pelapor
  - `startDate`, `endDate`: Filter rentang tanggal (`YYYY-MM-DD`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "b9f8e7d6-c5b4-4a3b-9c8d-7e6f5a4b3c2d",
      "userId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
      "title": "Tumpukan Botol Plastik di Halte Dukuh Atas",
      "description": "Banyak botol minuman plastik menumpuk di dekat jalur pedestrian.",
      "imageUrl": "/uploads/sample-plastic-1.jpg",
      "latitude": -6.2008,
      "longitude": 106.8228,
      "address": "Jl. Jend. Sudirman, Dukuh Atas, Jakarta Pusat",
      "wasteType": "plastic",
      "aiConfidence": 0.94,
      "status": "pending",
      "adminNotes": null,
      "createdAt": "2026-11-04T08:30:00.000Z",
      "updatedAt": "2026-11-04T08:30:00.000Z",
      "user": {
        "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "name": "Warga Pelapor Utama",
        "email": "user@smartwaste.id",
        "phone": "081298765432",
        "avatarUrl": null
      }
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 3.2. Daftar Laporan Milik Pengguna Sendiri
- **Endpoint:** `GET /api/reports/my`
- **Akses:** Auth (`user` / `admin`)
- **Query Parameters (Opsional):** `page`, `limit`, `status`, `waste_type`, `search`

### 3.3. Detail Laporan & Riwayat Audit Status
- **Endpoint:** `GET /api/reports/:id`
- **Akses:** `admin` atau pemilik laporan (`user_id == req.user.userId`)
- **Response `200 OK`:** Mengembalikan objek laporan lengkap beserta relasi `user` dan array `logs` (`report_logs` beserta petugas `changedBy`).

### 3.4. Buat Laporan Sampah Baru
- **Endpoint:** `POST /api/reports`
- **Akses:** Auth (`user` / `admin`)
- **Content-Type:** `multipart/form-data` (atau `application/json` jika menggunakan `image_url` dari hasil `/api/ml/predict`)
- **Form Fields:**
  - `title` *(wajib)*: Judul laporan
  - `description` *(wajib)*: Deskripsi kondisi sampah
  - `latitude` *(wajib)*: Koordinat lintang (contoh: `-6.2088`)
  - `longitude` *(wajib)*: Koordinat bujur (contoh: `106.8456`)
  - `address` *(opsional)*: Alamat lokasi
  - `waste_type` *(opsional)*: `organic` | `plastic` | `paper` (jika tidak diisi, server otomatis menjalankan klasifikasi CNN pada foto yang diunggah)
  - `ai_confidence` *(opsional)*: Skor confidence AI (`0.0` – `1.0`)
  - `image` *(wajib jika tanpa `image_url`)*: File foto sampah (`.jpg`, `.png`, `.webp`)

### 3.5. Perbarui Data Laporan
- **Endpoint:** `PUT /api/reports/:id`
- **Akses:** `admin` atau pemilik laporan
- **Request Body (`application/json` atau `multipart/form-data`):**
```json
{
  "title": "Tumpukan Kardus & Kertas di Pasar Baru",
  "description": "Volume bertambah sekitar 3 karung di sisi timur pintu masuk.",
  "address": "Jl. Pasar Baru No. 14, Sawah Besar, Jakarta Pusat",
  "waste_type": "paper"
}
```

### 3.6. Perbarui Status Laporan & Catat Audit Log (Khusus Admin)
- **Endpoint:** `PATCH /api/reports/:id/status`
- **Akses:** `admin`
- **Request Body (`application/json`):**
```json
{
  "status": "in_progress",
  "admin_notes": "Tim armada pengangkut sektor Jakarta Pusat sedang menuju lokasi."
}
```
- **Efek Transaksional:** Memperbarui `reports.status` dan `reports.admin_notes` sekaligus menyisipkan baris baru pada tabel `report_logs` dalam satu transaksi database (`prisma.$transaction`).

### 3.7. Hapus Laporan
- **Endpoint:** `DELETE /api/reports/:id`
- **Akses:** `admin` atau pemilik laporan
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Laporan berhasil dihapus."
}
```

---

## 4. Manajemen Pengguna (`/api/users` — Khusus Admin)

### 4.1. Daftar Semua Pengguna
- **Endpoint:** `GET /api/users`
- **Akses:** `admin`
- **Query Parameters:** `page`, `limit`, `search` (nama/email), `role` (`admin` | `user`)
- **Response `200 OK`:** Mengembalikan daftar pengguna beserta `reportsCount` (jumlah laporan yang telah dikirim masing-masing pengguna).

### 4.2. Detail Pengguna
- **Endpoint:** `GET /api/users/:id`
- **Akses:** `admin`

### 4.3. Perbarui Data / Role Pengguna
- **Endpoint:** `PUT /api/users/:id`
- **Akses:** `admin`
- **Request Body (`application/json`):**
```json
{
  "name": "Budi Santoso",
  "phone": "081311223344",
  "role": "user"
}
```

### 4.4. Hapus Pengguna
- **Endpoint:** `DELETE /api/users/:id`
- **Akses:** `admin` *(catatan: admin tidak dapat menghapus akun miliknya sendiri yang sedang aktif).*

---

## 5. Statistik Dashboard (`/api/stats`)

### 5.1. Statistik Global (Admin Dashboard)
- **Endpoint:** `GET /api/stats/dashboard`
- **Akses:** `admin`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalReports": 8,
    "totalUsers": 3,
    "byStatus": {
      "pending": 3,
      "in_progress": 2,
      "completed": 2,
      "rejected": 1
    },
    "byWasteType": {
      "organic": 3,
      "plastic": 3,
      "paper": 2,
      "unknown": 0
    },
    "reportsByMonth": [
      { "month": "Jun 2026", "count": 0 },
      { "month": "Jul 2026", "count": 0 },
      { "month": "Agu 2026", "count": 1 },
      { "month": "Sep 2026", "count": 2 },
      { "month": "Okt 2026", "count": 2 },
      { "month": "Nov 2026", "count": 3 }
    ],
    "recentReports": []
  }
}
```

### 5.2. Statistik Personal (User Dashboard & Mobile Home)
- **Endpoint:** `GET /api/stats/my`
- **Akses:** Auth (`user` / `admin`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "totalReports": 4,
    "byStatus": {
      "pending": 1,
      "in_progress": 1,
      "completed": 2,
      "rejected": 0
    },
    "byWasteType": {
      "organic": 1,
      "plastic": 2,
      "paper": 1,
      "unknown": 0
    },
    "recentReports": []
  }
}
```
