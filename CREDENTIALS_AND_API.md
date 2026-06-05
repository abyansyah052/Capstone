# Capstone: Test Credentials & API Reference Documentation

This document contains credentials for the seeded accounts across all four roles, results of the Google Auth validation, and a detailed reference guide for all API endpoints in this application.

---

## 1. Test User Accounts (Seeded)

The database automatically seeds these accounts during initial startup. Every account has the password: **`password`**

| Nama | Email | Password | Role | Deskripsi Hak Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Apex Admin** | `apex@asisya.com` | `password` | `apex` | Mengelola User (Ban, Unban, Hapus, Edit Role) & Memantau Log Aktivitas Sistem (Discord-like logs). |
| **Staff Utama** | `staff@asisya.com` | `password` | `staff` | CRUD database psikolog, hapus/edit pasien, promote/demote user (tidak bisa memodifikasi role apex/staff). |
| **Dr. Sarah Wijaya, M.Psi.** | `sarah.w@asisya.com` | `password` | `psikolog` | Pendaftaran pasien baru secara langsung, pengisian online signature pad, & menulis/menyimpan laporan konsultasi. |
| **Dairy Team** | `Dairyteam@Gmail.com` | `password` | `psikolog` | Akun psikolog default kedua dengan hak akses yang sama dengan Dr. Sarah Wijaya. |
| **User Reguler** | `reguler@asisya.com` | `password` | `reguler` | Hanya dapat melihat menu Janji Temu (khusus untuk jadwal yang memiliki checklist `"Akun reguler boleh tahu"`). |

---

## 2. Google Authentication Verification

Google login dan registrasi telah divalidasi dan diuji secara menyeluruh.

### Flow Kerja Google Auth:
- **Client Side (Vite):** Saat menekan tombol "Sign in with Google" di `LoginPage.tsx`, frontend akan memicu `handleGoogleLogin()` dengan data mock Google User (nama, email).
- **Server Side (Express):** Endpoint `POST /api/auth/google` memvalidasi payload.
  - Jika email belum ada di database, user otomatis terdaftar dengan role default `reguler` dan status `active`.
  - Jika email sudah ada di database, endpoint langsung masuk sebagai user tersebut (dengan role yang sesuai, misal jika sebelumnya dinaikkan menjadi `psikolog`, data signature akan diikutsertakan).
  - Jika user diblokir (`status = 'banned'`), login akan ditolak dengan error `403 Forbidden`.

### Hasil Tes Endpoint (`/api/auth/google`):
```bash
curl -i -X POST -H "Content-Type: application/json" \
  -d '{"email":"google_test@asisya.com", "name":"Google Test User"}' \
  http://localhost:5050/api/auth/google
```
**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "u-google-1780647493551",
    "name": "Google Test User",
    "email": "google_test@asisya.com",
    "role": "reguler",
    "status": "active",
    "signature": null
  }
}
```

---

## 3. API Headers Referensi (Authentication Header)

Semua route API yang dilindungi oleh middleware `requireAuth` membutuhkan header identitas berikut di sisi client (selama masa testing/development):

| Header | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `x-user-id` | `String` | ID dari user yang sedang aktif (misalnya `u-1`, `u-google-xyz`). |
| `x-user-role` | `String` | Role dari user (`apex`, `staff`, `psikolog`, `reguler`). |
| `x-user-email` | `String` | Email user aktif. |
| `x-user-name` | `String` (Optional) | Nama user aktif. |

---

## 4. API Endpoints Reference

### 4.1 Authentication & User Management (Prefix: `/api/auth`)

#### `POST /api/auth/register`
Mendaftarkan akun baru secara normal dengan email & password.
- **Role:** Publik / Bebas.
- **Request Body:**
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@gmail.com",
    "password": "password123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "ok": true,
    "data": {
      "id": "u-1780647890123",
      "name": "Budi Santoso",
      "email": "budi@gmail.com",
      "role": "reguler",
      "status": "active"
    }
  }
  ```

#### `POST /api/auth/login`
Melakukan otentikasi konvensional.
- **Role:** Publik / Bebas.
- **Request Body:**
  ```json
  {
    "email": "staff@asisya.com",
    "password": "password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": "u-2",
      "name": "Staff Utama",
      "email": "staff@asisya.com",
      "role": "staff",
      "status": "active",
      "signature": null
    }
  }
  ```

#### `POST /api/auth/google`
Mock Google Sign-In (Registrasi otomatis jika baru, atau login jika email sudah ada).
- **Role:** Publik / Bebas.
- **Request Body:**
  ```json
  {
    "email": "google_user@gmail.com",
    "name": "Google Account Name"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": {
      "id": "u-google-123456",
      "name": "Google Account Name",
      "email": "google_user@gmail.com",
      "role": "reguler",
      "status": "active",
      "signature": null
    }
  }
  ```

#### `POST /api/auth/signature`
Menyimpan tanda tangan elektronik berupa Base64 canvas drawing.
- **Role:** Terotentikasi, khusus `psikolog`.
- **Request Body:**
  ```json
  {
    "signature": "data:image/png;base64,iVBORw0KGgoAAAANS..."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "Signature saved successfully"
  }
  ```

#### `GET /api/auth/users`
Mengambil semua daftar user terdaftar di sistem.
- **Role:** Terotentikasi, khusus `apex` dan `staff`.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": "u-1",
        "name": "Apex Admin",
        "email": "apex@asisya.com",
        "role": "apex",
        "status": "active",
        "created_at": "2026-06-05T08:00:00.000Z"
      }
    ]
  }
  ```

#### `PUT /api/auth/users/:id/role`
Mengubah role user (Promote/Demote). Jika diubah ke `psikolog`, profile psikolog baru otomatis dibuat. Jika didegradasi dari `psikolog`, profile psikolog akan dihapus.
- **Role:** Terotentikasi, `apex` dan `staff`. *(Catatan: Staff tidak diperbolehkan mempromosikan ke/atau memodifikasi akun berole apex & staff)*.
- **Request Body:**
  ```json
  {
    "role": "psikolog",
    "sipp": "SIPP/09/2026/01",
    "origin": "Surabaya",
    "age": 30,
    "phone": "+6281...",
    "address": "Jl. Raya Surabaya"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "User role successfully updated to psikolog"
  }
  ```

#### `PUT /api/auth/users/:id/status`
Melakukan Ban / Unban terhadap user.
- **Role:** Terotentikasi, khusus `apex`. *(Catatan: Admin Apex tidak diizinkan mem-ban diri sendiri)*.
- **Request Body:**
  ```json
  {
    "status": "banned"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "User status successfully updated to banned"
  }
  ```

#### `DELETE /api/auth/users/:id`
Menghapus user permanen dari database.
- **Role:** Terotentikasi, khusus `apex`. *(Catatan: Admin Apex tidak diizinkan menghapus diri sendiri)*.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "message": "User deleted successfully"
  }
  ```

#### `GET /api/auth/logs`
Mengambil riwayat log aktivitas (Discord-like action logs) maksimum 100 entri terbaru.
- **Role:** Terotentikasi, khusus `apex`.
- **Response (200 OK):**
  ```json
  {
    "ok": true,
    "data": [
      {
        "id": 1,
        "user_id": "u-2",
        "email": "staff@asisya.com",
        "action": "USER_ROLE_PROMOTION",
        "details": "Updated user budi@gmail.com role from reguler to psikolog",
        "created_at": "2026-06-05T08:10:00.000Z"
      }
    ]
  }
  ```

---

### 4.2 Pasien Endpoints (Prefix: `/api/patients`)

#### `GET /api/patients`
Melihat daftar seluruh pasien terdaftar.
- **Role:** Terotentikasi, khusus `staff`.

#### `GET /api/patients/:id`
Melihat detail lengkap satu pasien berdasarkan ID.
- **Role:** Terotentikasi, `staff` dan `psikolog`.

#### `POST /api/patients`
Pendaftaran data pasien baru.
- **Role:** Terotentikasi, `staff` dan `psikolog`.
- **Request Body:**
  ```json
  {
    "name": "Adi Wijaya",
    "email": "adi@gmail.com",
    "idNumber": "35780...",
    "age": 25,
    "gender": "Laki-laki",
    "phone": "+6281...",
    "registeredAt": "2026-06-05",
    "initials": "AW",
    "batchId": "B001",
    "birthPlace": "Surabaya",
    "education": "S1",
    "siblingOrder": "1",
    "totalSiblings": "3",
    "dateOfBirth": "2001-01-01",
    "occupation": "Karyawan Swasta",
    "country": "ID",
    "province": "Jawa Timur",
    "city": "Surabaya",
    "fullAddress": "Mulyorejo, Surabaya",
    "photo": null
  }
  ```

#### `PUT /api/patients/:id`
Mengubah data pasien.
- **Role:** Terotentikasi, khusus `staff`.

#### `DELETE /api/patients/:id`
Menghapus data pasien.
- **Role:** Terotentikasi, khusus `staff`.

---

### 4.3 Psikolog Endpoints (Prefix: `/api/psychologists`)

#### `GET /api/psychologists`
Melihat daftar database profil psikolog aktif.
- **Role:** Terotentikasi, `staff` dan `apex`.

#### `GET /api/psychologists/:id`
Mendapatkan profil satu psikolog.
- **Role:** Terotentikasi, `staff` dan `apex`.

#### `POST /api/psychologists`
Mendaftarkan profil psikolog baru.
- **Role:** Terotentikasi, `staff` dan `apex`.

#### `PUT /api/psychologists/:id`
Mengupdate informasi profil psikolog.
- **Role:** Terotentikasi, `staff` dan `apex`.

#### `DELETE /api/psychologists/:id`
Menghapus profil psikolog.
- **Role:** Terotentikasi, `staff` dan `apex`.

---

### 4.4 Janji Temu / Appointments Endpoints (Prefix: `/api/appointments`)

#### `GET /api/appointments`
Mengambil semua janji temu.
- **Role:** Terotentikasi. *(Catatan: Untuk role `reguler`, endpoint ini secara otomatis menyaring data agar hanya mengembalikan janji temu yang diset `visibleToRegular = true`)*.

#### `POST /api/appointments`
Menjadwalkan janji temu baru. Otomatis menembak simulasi WhatsApp & Email Calendar ICS notification jika opsi pengiriman diaktifkan.
- **Role:** Terotentikasi (`staff`, `psikolog`, `reguler`, `apex`).
- **Request Body:**
  ```json
  {
    "patientId": "pt-1234",
    "patientName": "Adi Wijaya",
    "doctorId": "psy-1",
    "date": "2026-06-10",
    "time": "09:00",
    "duration": 60,
    "type": "Konsultasi Umum",
    "status": "scheduled",
    "notes": "Keluhan cemas",
    "notify": "both",
    "notifyPhone": "+6281234567890",
    "notifyEmail": "adi@gmail.com",
    "visibleToRegular": true
  }
  ```

#### `PUT /api/appointments/:id`
Mengubah data jadwal / status janji temu.
- **Role:** Terotentikasi (`staff`, `psikolog`, `reguler`, `apex`).

#### `DELETE /api/appointments/:id`
Membatalkan / menghapus jadwal janji temu.
- **Role:** Terotentikasi (`staff`, `psikolog`, `reguler`, `apex`).
