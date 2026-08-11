import cv2
import numpy as np
import time
import threading
from detector import OsuDetector, OsuController

class OsuPlayer:
    def __init__(self):
        self.detector = OsuDetector()
        self.controller = OsuController()
        
        # Pengaturan timing
        self.CLICK_DELAY = 0.05  # Delay sebelum klik (detik)
        self.PLAY_DELAY = 2.0    # Delay sebelum mulai main (detik)
        self.DEBUG_MODE = False
        
        # State
        self.running = False
        self.last_circles = []
        
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
            self.running = False
    
    def stop(self):
        """Stop autoplayer"""
        self.running = False
    
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
            cv2.waitKey(1)
        
        # Process circles
        self._process_circles(circles)
        
        # Small delay
        time.sleep(0.01)
    
    def _process_circles(self, circles):
        """Proses dan klik lingkaran yang harus ditekan"""
        current_time = time.time()
        
        for circle in circles:
            # Cek apakah circle ini baru (belum diklik)
            circle_id = f"{circle.x}_{circle.y}_{int(circle.timestamp)}"
            
            # Hitung timing: klik ketika approach circle mendekati circle utama
            # Untuk osu!, idealnya klik ketika approach overlap dengan circle
            time_to_click = self._calculate_click_timing(circle, current_time)
            
            if time_to_click <= self.CLICK_DELAY and time_to_click > 0:
                # Klik!
                print(f"Click at ({circle.x}, {circle.y}) - conf: {circle.confidence:.2f}")
                self.controller.click(circle.x, circle.y)
                time.sleep(self.CLICK_DELAY)
    
    def _calculate_click_timing(self, circle, current_time: float) -> float:
        """Hitung kapan harus klik circle"""
        # Simple approach: klik segera setelah terdeteksi
        # Idealnya: hitung berdasarkan approach circle shrinking
        elapsed = current_time - circle.timestamp
        
        # Klik setelah 0.1-0.3 detik terdeteksi (adjust sesuai kebutuhan)
        ideal_click_time = 0.2
        
        return ideal_click_time - elapsed

def main():
    print("=" * 50)
    print("OSU! AUTOPLAYER - Lucy AI")
    print("=" * 50)
    print("Controls:")
    print("  - Ctrl+C: Stop")
    print("  - Debug mode: python main.py --debug")
    print("=" * 50)
    
    import sys
    debug = "--debug" in sys.argv
    
    player = OsuPlayer()
    player.start(debug=debug)

if __name__ == "__main__":
    main()