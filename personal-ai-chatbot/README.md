# Lucy - Personal AI Assistant

Asisten AI pribadi multi-platform untuk Web, Discord, Telegram, dan VTube Studio.

## Fitur

- Chat AI dengan persona ramah (didukung OpenRouter, Gemini, OpenAI, atau fallback offline).
- Sistem memori: Core memory (identitas bot), user memory (fakta tentang user), temporary memory (2 jam terakhir), dan riwayat chat.
- Pengingat (reminder) mandiri dengan parser waktu bahasa natural ("10 menit lagi", "jam 22:00").
- Integrasi VTube Studio untuk reaksi ekspresi avatar otomatis sesuai emosi chat.
- Keamanan: autentikasi JWT, role owner/user, dan anti-spoofing via bot service key.

## Cara Menjalankan

### 1. Setup Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Server backend akan berjalan di `http://localhost:3001`.

### 2. Setup Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Buka `http://localhost:5173` di browser.

### 3. Menjalankan Bot (Opsional)

Isi token bot di `backend/.env`, lalu jalankan:

```bash
# Discord Bot
node backend/discordBot.js

# Telegram Bot
node backend/telegramBot.js
```

## Pengujian (Testing)

Jalankan unit dan integration test:

```bash
cd backend
npm test
```

## Dokumentasi Tambahan

- [Dokumentasi API](backend/API_DOCS.md)
- [Catatan Keamanan & Akses](SECURITY.md)
- [Panduan Setup VTube Studio](backend/VTUBE_SETUP.md)
