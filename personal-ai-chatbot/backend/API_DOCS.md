# Dokumentasi API Lucy

Base URL: `http://localhost:3001`

Format response sukses:
```json
{
  "success": true,
  "data": {},
  "message": "pesan opsional"
}
```

Format response error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Penjelasan error",
    "details": null
  }
}
```

---

## 1. Auth (`/api/auth`)

### `POST /api/auth/login/owner`
Login khusus owner menggunakan secret key.
- **Body**: `{ "secretKey": "string" }`
- **Response**: Mengembalikan token JWT dengan role `owner`.

### `POST /api/auth/session`
Mendapatkan token sesi untuk Web.
- **Body**: `{ "userId": "string (opsional)" }`
- **Response**: Mengembalikan token JWT sesi.

### `POST /api/auth/link` *(Perlu Auth)*
Menghubungkan akun Discord/Telegram ke akun saat ini.
- **Body**: `{ "platform": "discord" | "telegram" | "web", "platformUserId": "string" }`

### `GET /api/auth/me`
Melihat data user yang sedang login.

---

## 2. Chat (`/api/chat` atau `/chat`)

### `POST /api/chat`
Kirim pesan ke Lucy.
- **Headers**:
  - `Authorization: Bearer <token>` (Web), atau
  - `x-service-key: <key>` dan `x-user-id: <id>` (Bot)
- **Body**:
  ```json
  {
    "message": "Halo Lucy!",
    "preferredProvider": "openrouter"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "reply": "Halo! Ada yang bisa kubantu?",
    "data": {
      "reply": "Halo! Ada yang bisa kubantu?",
      "mode": "openrouter",
      "emotion": "senang"
    }
  }
  ```

### `GET /api/chat/history` *(Perlu Auth)*
Melihat 10 pesan riwayat chat terakhir.

### `DELETE /api/chat/history` *(Perlu Auth)*
Menghapus riwayat chat user.

---

## 3. Memory (`/api/memory`)

### `GET /api/memory/core`
Melihat identitas, kepribadian, dan fakta dasar Lucy.

### `PUT /api/memory/core` *(Khusus Owner)*
Update identitas/aturan Lucy.

### `GET /api/memory/user` *(Perlu Auth)*
Melihat daftar memori jangka panjang milik user saat ini.

### `POST /api/memory/user` *(Perlu Auth)*
Menambahkan fakta ke memori user.
- **Body**:
  ```json
  {
    "content": "Saya suka minum teh hijau",
    "category": "preference",
    "importance": 4
  }
  ```

### `DELETE /api/memory/user/:memoryId` *(Perlu Auth)*
Menghapus item memori tertentu.

### `GET /api/memory/temporary` *(Perlu Auth)*
Melihat memori sementara (2 jam terakhir).

---

## 4. Reminder (`/api/reminders`)

### `GET /api/reminders` *(Perlu Auth)*
Melihat daftar reminder yang sedang aktif.

### `POST /api/reminders` *(Perlu Auth)*
Membuat reminder baru.
- **Body (Bahasa natural)**:
  ```json
  {
    "naturalText": "ingatkan saya 15 menit lagi untuk istirahat"
  }
  ```
- **Body (Waktu pasti)**:
  ```json
  {
    "message": "Meeting",
    "scheduledAt": "2026-08-18T22:00:00.000Z"
  }
  ```

### `DELETE /api/reminders/:id` *(Perlu Auth)*
Menghapus reminder tertentu.

### `DELETE /api/reminders/all` *(Khusus Owner)*
Menghapus seluruh reminder di sistem.

---

## 5. VTube Studio (`/api/vtube`)

### `GET /api/vtube/status`
Melihat status koneksi ke VTube Studio.

### `POST /api/vtube/expression` *(Perlu Auth)*
Memicu ekspresi avatar secara manual.
- **Body**: `{ "expression": "senang" }`

### `POST /api/vtube/reconnect` *(Khusus Owner)*
Mencoba koneksi ulang ke VTube Studio.

---

## 6. Health Check (`/api/health`)

### `GET /api/health`
Status server, provider AI yang aktif, dan waktu WIB.
