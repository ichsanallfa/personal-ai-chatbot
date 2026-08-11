# Osu! Autoplayer - Lucy AI

Python script untuk autoplay osu! menggunakan computer vision.

## Setup

1. Install Python dependencies:
```bash
cd personal-ai-chatbot/osu-player
pip install -r requirements.txt
```

2. Pastikan osu! sudah terinstall dan beatmap siap dijalankan

## Cara Pakai

### Mode Normal
```bash
python main.py
```

### Mode Debug (tampilkan deteksi circle)
```bash
python main.py --debug
```

## Controls
- `Ctrl+C` - Stop autoplayer

## Catatan Penting

- Pastikan osu! berjalan di **fullscreen/maximized**
- Beatmap harus sudah dimulai sebelum script dijalankan
- Delay 2 detik diberikan untuk persiapan
- Auto-click berdasarkan deteksi lingkaran putih osu!

## File Structure

```
osu-player/
├── main.py           # Entry point
├── detector.py       # Circle detection + controller
├── requirements.txt  # Python dependencies
└── README.md
```

## Troubleshooting

- Jika tidak detect circle: coba adjust `CIRCLE_THRESHOLD` di `detector.py`
- Jika klik tidak akurat: coba adjust `CLICK_DELAY` di `main.py`
- Windows: jalankan sebagai Administrator untuk akses mouse