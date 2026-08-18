# Security & Access Control

Dokumen ini menjelaskan alur keamanan, pembagian role, dan proteksi request pada backend Lucy.

## 1. Proteksi Identitas (Anti-Spoofing)

Header `x-user-id` saja tidak dipercaya untuk memberikan akses khusus.

- **Web**: Menggunakan session JWT token (`/api/auth/session` atau `/api/auth/login/owner`).
- **Bot (Discord & Telegram)**: Menggunakan header `x-service-key` yang dicocokkan dengan `SERVICE_API_KEY` di server.
- Request tanpa token atau service key yang valid otomatis masuk ke role `public`.

## 2. Tabel Hak Akses (RBAC)

| Fitur / Endpoint | Public | User / Allowed | Owner |
| :--- | :--- | :--- | :--- |
| Chat (`/api/chat`) | Ya (mode publik) | Ya | Ya (akses penuh) |
| Baca memory sendiri (`/api/memory/user`) | Tidak | Ya | Ya |
| Edit core memory Lucy (`/api/memory/core`) | Tidak | Tidak | Ya |
| Hapus semua reminder (`/api/reminders/all`) | Tidak | Tidak | Ya |
| Reconnect VTube Studio (`/api/vtube/reconnect`) | Tidak | Tidak | Ya |
| Link akun platform (`/api/auth/link`) | Tidak | Ya | Ya |

## 3. Rate Limiting

- **Chat**: 30 request/menit per user/IP.
- **Login Owner**: 10 request/menit (mencegah brute force).
- **Endpoint umum**: 100 request/menit.
- Owner dan internal bot service key otomatis bypass rate limit.

## 4. Keamanan Data & Secret

- Seluruh data JSON disimpan di `backend/data/` dan masuk ke `.gitignore`.
- Jangan commit file `.env` atau token `vts-auth-token.txt`.
