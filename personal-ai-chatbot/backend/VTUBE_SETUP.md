# VTube Studio Integration - Lucy AI Avatar

## Cara Setup

### 1. Install VTube Studio
- Download dari [Steam](https://store.steampowered.com/app/1325860/VTube_Studio/) (gratis)
- Atau dari [itch.io](https://denchisoft.itch.io/vtube-studio)

### 2. Aktifkan Plugin API
1. Buka VTube Studio
2. Klik **Settings** (ikon gear)
3. Pilih tab **Plugin API**
4. Aktifkan **"Enable Plugin API"**
5. Catat port (default: **8001**)

### 3. Siapkan Avatar
- Import avatar VTube (.vts) atau Live2D (.moc3)
- Pastikan avatar punya ekspresi:
  - Happy
  - Angry
  - Sad
  - Laughing
  - Neutral

### 4. Jalankan Bot
```bash
cd "d:\Ai project\personal-ai-chatbot\backend"
node server.js
```

### 5. Test
- Chat dengan Lucy di Discord/Telegram
- Avatar akan berekspresi sesuai emosi:
  - "senang" → Happy
  - "kesal" → Angry
  - "sedih" → Sad
  - "lucu" → Laughing
  - "terima kasih" → Happy
  - "maaf" → Sad

## Troubleshooting

### VTube Studio tidak terhubung
- Pastikan VTube Studio sudah dibuka
- Pastikan Plugin API aktif
- Pastikan port 8001 tidak dipakai aplikasi lain

### Avatar tidak berekspresi
- Pastikan avatar punya ekspresi dengan nama yang sesuai
- Cek nama ekspresi di VTube Studio (Expression tab)
- Sesuaikan nama di `vtubeConnector.js` jika berbeda

### Token Authentication
Jika VTube Studio meminta token:
1. Buka VTube Studio → Settings → Plugin API
2. Klik "Get Token"
3. Copy token ke `vtubeConnector.js` → `VTUBE_AUTH_TOKEN`

## File Terkait
- `vtubeConnector.js` - Koneksi WebSocket ke VTube Studio
- `server.js` - Integrasi emosi → ekspresi avatar