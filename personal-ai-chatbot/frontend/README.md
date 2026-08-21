# Lucy Frontend - React Web Interface

Frontend web application untuk Lucy AI Assistant yang dibangun dengan React dan Vite.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Teknologi

- React - UI library
- Vite - Build tool dan dev server
- Axios - HTTP client untuk komunikasi dengan backend
- ESLint - Code linting

## Konfigurasi

### Environment Variables

Buat file `.env` di root folder frontend:

```env
VITE_API_URL=http://localhost:3001
```

**Production:**
```env
VITE_API_URL=https://your-backend-domain.com
```

## Struktur Folder

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── assets/          # Images, icons, static files
│   ├── App.jsx          # Main app component
│   ├── App.css          # App styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Public static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── eslint.config.js     # ESLint configuration
└── package.json         # Dependencies
```

## API Integration

Frontend berkomunikasi dengan backend melalui REST API di `http://localhost:3001`.

### Endpoints yang Digunakan

- `POST /api/auth/session` - Login/create session
- `POST /api/auth/login/owner` - Owner login
- `POST /api/chat` - Send message to Lucy
- `GET /api/chat/history` - Get chat history
- `GET /api/memory/user` - Get user memories
- `GET /api/reminders` - Get active reminders
- `GET /api/health` - Check backend status

Lihat [API Documentation](../backend/API_DOCS.md) untuk detail lengkap.

## Fitur

- Chat Interface - Real-time chat dengan Lucy AI
- Authentication - Login sebagai user atau owner
- Chat History - Riwayat percakapan tersimpan
- Memory View - Lihat memori yang tersimpan tentang Anda
- Reminder Management - Kelola pengingat
- Responsive Design - Optimal di desktop dan mobile

## Development

### Scripts

```bash
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Server

Dev server akan berjalan di http://localhost:5173 dengan hot module replacement (HMR).

## Build dan Deploy

### Build untuk Production

```bash
npm run build
```

Output akan berada di folder `dist/`.

### Deploy

Upload folder `dist/` ke hosting pilihan Anda:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop folder `dist/`
- **Static Server**: Copy `dist/` ke web server

### Environment Variables di Production

Pastikan set VITE_API_URL ke URL backend production Anda.

## Keamanan

- Semua request ke backend menggunakan JWT token di header `Authorization`
- Token disimpan di localStorage browser
- CORS sudah dikonfigurasi di backend untuk komunikasi aman

## Troubleshooting

### CORS Error
Pastikan backend sudah running dan CORS dikonfigurasi dengan benar di `backend/src/app.js`.

### Connection Refused
Periksa apakah backend berjalan di port yang benar (default: 3001).

### Build Errors
Hapus `node_modules` dan reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Notes

- Frontend menggunakan Vite untuk development yang lebih cepat
- Semua environment variables harus diawali dengan `VITE_`
- Hot reload otomatis saat development

---

Untuk informasi lebih lanjut, lihat [dokumentasi utama](../README.md).
