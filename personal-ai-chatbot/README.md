# Lucy – Asisten AI Pribadi

Lucy adalah asisten AI multi-platform yang dapat diakses melalui web, Discord, Telegram, dan VTube Studio.  
Proyek ini dibangun dengan arsitektur modular menggunakan Node.js backend, React frontend, dan integrasi bot untuk berbagai platform.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Penggunaan](#penggunaan)
- [Pengujian](#pengujian)
- [Dokumentasi](#dokumentasi)
- [Keamanan](#keamanan)

## Fitur Utama

### 1. Multi-Provider AI Chat
- Mendukung OpenRouter, Google Gemini, dan OpenAI
- Sistem fallback otomatis ke mode offline saat koneksi terputus
- Deteksi emosi untuk integrasi dengan VTube Studio

### 2. Sistem Memori Berlapis
- Core Memory: Identitas, kepribadian, dan aturan dasar Lucy
- User Memory: Fakta jangka panjang tentang pengguna seperti preferensi dan hobi
- Session Memory: Konteks percakapan dalam 2 jam terakhir
- Temporary Memory: Cache sementara untuk optimasi performa

### 3. Pengingat Cerdas
- Parsing bahasa natural ("15 menit lagi", "jam 22:00", "besok pagi")
- Penjadwalan otomatis dengan timezone WIB
- Notifikasi multi-platform (Web, Discord, Telegram)

### 4. **Integrasi VTube Studio**
- Kontrol ekspresi avatar secara otomatis berdasarkan emosi
- Koneksi WebSocket ke VTube Studio API
- Trigger hotkey untuk berbagai ekspresi

### 5. Keamanan dan Role-Based Access Control
- Autentikasi JWT untuk Web
- Service Key untuk bot Discord dan Telegram
- Sistem role dengan tiga level: Public, User, dan Owner
- Rate limiting untuk setiap endpoint
- Proteksi anti-spoofing

## Teknologi

### Backend
- Node.js dan Express.js
- AI Providers: OpenRouter, Google Gemini, OpenAI
- Bot Frameworks: Discord.js, node-telegram-bot-api
- VTube Studio API melalui WebSocket
- Security: JWT, bcrypt, express-rate-limit
- Storage: JSON file-based dengan atomic writes

### Frontend
- React dan Vite
- Responsive design untuk berbagai ukuran layar
- State management dengan React hooks
- HTTP client menggunakan Axios

## Instalasi

### Prasyarat
- Node.js versi 16 atau lebih baru
- npm atau yarn
- VTube Studio jika ingin menggunakan fitur avatar

### 1. Clone Repository

```bash
git clone https://github.com/ichsanallfa/personal-ai-chatbot.git
cd personal-ai-chatbot
```

### 2. Install Dependencies

```bash
# Install dependencies untuk root project
npm install

# Install dependencies backend
cd backend
npm install

# Install dependencies frontend
cd ../frontend
npm install
```

## Konfigurasi

### Backend Configuration

1. Salin file konfigurasi contoh:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env` dengan konfigurasi Anda:

```env
# Server
PORT=3001
NODE_ENV=development

# AI Providers (minimal 1 harus diisi)
OPENROUTER_API_KEY=your_openrouter_key
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Bot Tokens (opsional)
DISCORD_TOKEN=your_discord_token
TELEGRAM_TOKEN=your_telegram_token

# Security
JWT_SECRET=your_random_jwt_secret_here
OWNER_SECRET_KEY=your_owner_password
SERVICE_API_KEY=your_service_key_for_bots

# VTube Studio (opsional)
VTUBE_STUDIO_PORT=8001
```

### Frontend Configuration

1. Salin file konfigurasi contoh:
```bash
cd frontend
cp .env.example .env
```

2. Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

## Penggunaan

### Menjalankan Backend

```bash
cd backend
npm run dev              # Mode pengembangan dengan nodemon
# atau
npm start                # Mode produksi
```

Server akan berjalan di http://localhost:3001

### Menjalankan Frontend

```bash
cd frontend
npm run dev              # Mode pengembangan
# atau
npm run build && npm run preview  # Mode produksi
```

Aplikasi web akan tersedia di http://localhost:5173

### Menjalankan Bot (Opsional)

#### Discord Bot
```bash
node backend/discordBot.js
```

#### Telegram Bot
```bash
node backend/telegramBot.js
```

Tips: Gunakan process manager seperti PM2 untuk produksi:
```bash
pm2 start backend/src/server.js --name "lucy-backend"
pm2 start backend/discordBot.js --name "lucy-discord"
pm2 start backend/telegramBot.js --name "lucy-telegram"
```

## Pengujian

Proyek ini dilengkapi dengan test suite lengkap untuk memastikan kualitas kode dan fungsionalitas.

### Menjalankan Semua Test

```bash
cd backend
npm test
```

### Test Coverage

Test suite mencakup:
- AI Service: Fallback mechanism, provider switching, error handling
- Authentication: JWT generation dan validation, role-based access
- Memory System: Operasi core, user, session, dan temporary memory
- Reminder: Natural language parsing, scheduling, timezone handling
- API Endpoints: Request dan response validation, error handling
- VTube Integration: Connection dan expression triggers
- Discord Bot: Command processing dan message handling
- Identity Management: User linking dan platform integration

### Menjalankan Test Spesifik

```bash
npm test -- ai.test.js          # Test AI service
npm test -- auth.test.js        # Test authentication
npm test -- memory.test.js      # Test memory system
npm test -- reminder.test.js    # Test reminder
npm test -- api.test.js         # Test API endpoints
```

## Dokumentasi

### Dokumentasi Lengkap

- [API Documentation](backend/API_DOCS.md) - Dokumentasi lengkap semua endpoint REST API
- [Security Guide](SECURITY.md) - Panduan keamanan, RBAC, dan rate limiting
- [VTube Setup](backend/VTUBE_SETUP.md) - Cara setup dan konfigurasi VTube Studio

### Struktur Proyek

```
personal-ai-chatbot/
├── backend/                    # Backend Node.js
│   ├── src/
│   │   ├── config/            # Konfigurasi aplikasi
│   │   ├── controllers/       # Route controllers
│   │   ├── middlewares/       # Auth, validation, error handling
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic (AI, auth, memory, reminder, vtube)
│   │   ├── storage/           # JSON storage handler
│   │   └── utils/             # Utility functions
│   ├── data/                  # Data storage (git-ignored)
│   ├── test/                  # Test files
│   ├── discordBot.js          # Discord bot entry point
│   ├── telegramBot.js         # Telegram bot entry point
│   └── server.js              # Legacy server (deprecated)
├── frontend/                   # Frontend React + Vite
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── assets/            # Static assets
│   │   └── App.jsx            # Main app component
│   └── public/                # Public assets
└── osu-player/                # osu! integration (optional)
```

## Keamanan

### Role-Based Access Control (RBAC)

| Endpoint | Public | User | Owner |
|----------|--------|------|-------|
| Chat | Ya | Ya | Ya |
| User Memory | Tidak | Ya | Ya |
| Core Memory | Tidak | Tidak | Ya |
| Delete All Reminders | Tidak | Tidak | Ya |
| VTube Reconnect | Tidak | Tidak | Ya |

### Rate Limiting

- Chat: 30 requests per menit per user
- Owner Login: 10 requests per menit untuk proteksi brute force
- General: 100 requests per menit per IP

### Best Practices

1. Jangan commit file sensitif:
   - .env
   - vts-auth-token.txt
   - backend/data/*.json

2. Gunakan environment variables untuk semua secret keys

3. Update dependencies secara berkala untuk patch keamanan

## Kontribusi

Kontribusi sangat diterima. Silakan:
1. Fork repository ini
2. Buat branch fitur (git checkout -b feature/AmazingFeature)
3. Commit perubahan (git commit -m 'Add some AmazingFeature')
4. Push ke branch (git push origin feature/AmazingFeature)
5. Buat Pull Request

## Lisensi

Proyek ini adalah proyek pribadi. Silakan hubungi pemilik untuk informasi lisensi.

## Author

Ichsan Allfa
- GitHub: [@ichsanallfa](https://github.com/ichsanallfa)

## Acknowledgments

- OpenRouter, Google Gemini, OpenAI untuk AI API
- Discord.js dan node-telegram-bot-api untuk bot frameworks
- VTube Studio untuk avatar integration
- Komunitas open source yang telah berkontribusi pada dependencies yang digunakan

---

Note: Pastikan untuk membaca [SECURITY.md](SECURITY.md) dan [API_DOCS.md](backend/API_DOCS.md) sebelum deployment ke production.
