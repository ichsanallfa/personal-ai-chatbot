import cv2
import time
import math
from detector import OsuDetector, OsuController

class OsuPlayer:
    def __init__(self):
        self.detector = OsuDetector()
        self.controller = OsuController()
        
        # Pengaturan timing
        self.CLICK_DELAY = 0.03  # Delay antar tap (detik)
        self.PLAY_DELAY = 2.0    # Delay sebelum mulai main (detik)
        self.DEBUG_MODE = False
        
        # State
        self.running = False
        # Dictionary menyimpan circle yang sudah diklik {(x, y): timestamp}
        self.clicked_circles = {}
        
    def start(self, debug: bool = False):
        """Mulai autoplayer"""
        self.DEBUG_MODE = debug
        self.running = True
        
        print(f"Osu! Autoplayer mulai dalam {self.PLAY_DELAY} detik...")
        print("Pastikan osu! sudah fullscreen dan beatmap sudah dimulai!")
        time.sleep(self.PLAY_DELAY)
        
        print("Playing... tekan Ctrl+C untuk berhenti")
        
        try:
            while self.running:
                self._game_loop()
        except KeyboardInterrupt:
            print("\nStopped.")
        finally:
            self.stop()
    
    def stop(self):
        """Stop autoplayer dan bersihkan resource"""
        self.running = False
        self.detector.close()
        if self.DEBUG_MODE:
            cv2.destroyAllWindows()
    
    def _game_loop(self):
        """Main game loop"""
        # Capture screen
        frame = self.detector.capture_screen()
        
        # Detect circles
        circles = self.detector.detect_circles(frame)
        
        # Debug mode
        if self.DEBUG_MODE:
            debug_frame = self.detector.draw_debug(frame, circles)
            cv2.imshow("Osu! Autoplayer Debug", debug_frame)
            if cv2.waitKey(1) & 0xFF == 27:  # ESC to quit debug
                self.running = False
                return
        
        # Process circles
        self._process_circles(circles)
        
        # Small delay to yield CPU
        time.sleep(0.005)
    
    def _is_already_clicked(self, circle, current_time: float) -> bool:
        """Cek apakah lingkaran di koordinat ini sudah diklik baru-baru ini"""
        # Bersihkan riwayat lama (> 1.5 detik)
        self.clicked_circles = {
            pos: t for pos, t in self.clicked_circles.items()
            if current_time - t < 1.5
        }
        
        threshold = max(circle.radius * 0.8, 25.0)
        for (cx, cy), t in self.clicked_circles.items():
            dist = math.hypot(circle.x - cx, circle.y - cy)
            if dist < threshold and (current_time - t < 0.6):
                return True
        return False

    def _process_circles(self, circles):
        """Proses dan klik lingkaran yang harus ditekan"""
        current_time = time.time()
        
        for circle in circles:
            if self._is_already_clicked(circle, current_time):
                continue

            time_to_click = self._calculate_click_timing(circle, current_time)
            
            if time_to_click <= self.CLICK_DELAY:
                # Tap menggunakan tombol z/x alternating
                print(f"Tap at ({circle.x}, {circle.y}) - conf: {circle.confidence:.2f}")
                self.controller.tap(circle.x, circle.y)
                self.clicked_circles[(circle.x, circle.y)] = current_time
                time.sleep(self.CLICK_DELAY)
                break
    
    def _calculate_click_timing(self, circle, current_time: float) -> float:
        """Hitung kapan harus klik circle berdasarkan rasio approach circle"""
        # Jika approach circle mendekati ukuran circle utama (rasio <= 1.15), saatnya klik
        if circle.radius > 0 and circle.approach_radius > 0:
            ratio = circle.approach_radius / circle.radius
            if ratio <= 1.2:
                return 0.0

        elapsed = current_time - circle.timestamp
        ideal_click_time = 0.15
        return max(0.0, ideal_click_time - elapsed)

def main():
    print("=" * 50)
    print("OSU! AUTOPLAYER - Lucy AI")
    print("=" * 50)
    print("Controls:")
    print("  - Ctrl+C atau ESC di debug: Stop")
    print("  - Debug mode: python main.py --debug")
    print("=" * 50)
    
    import sys
    debug = "--debug" in sys.argv
    
    player = OsuPlayer()
    player.start(debug=debug)

if __name__ == "__main__":
    main()