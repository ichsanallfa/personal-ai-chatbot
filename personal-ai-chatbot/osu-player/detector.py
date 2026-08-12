import cv2
import numpy as np
import mss
import time
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class Circle:
    x: int
    y: int
    radius: int
    approach_radius: float
    timestamp: float
    confidence: float

class OsuDetector:
    def __init__(self):
        # Warna-warna osu! (BGR format untuk OpenCV)
        self.CIRCLE_COLOR = np.array([255, 255, 255])  # Putih
        self.APPROACH_COLOR = np.array([255, 255, 255])  # Putih
        self.BG_COLOR = np.array([0, 0, 0])  # Hitam
        
        # Threshold deteksi
        self.CIRCLE_THRESHOLD = 0.6
        self.MIN_RADIUS = 20
        self.MAX_RADIUS = 100
        
    def capture_screen(self, monitor: int = 1) -> np.ndarray:
        """Capture screen menggunakan mss"""
        with mss.mss() as sct:
            monitor_data = sct.monitors[monitor]
            screenshot = sct.grab(monitor_data)
            img = np.array(screenshot)
            return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    
    def detect_circles(self, frame: np.ndarray) -> List[Circle]:
        """Deteksi lingkaran osu! dari frame"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        
        # HoughCircles untuk deteksi lingkaran
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=50,
            param1=50,
            param2=30,
            minRadius=self.MIN_RADIUS,
            maxRadius=self.MAX_RADIUS
        )
        
        detected = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for x, y, r in circles:
                # Cek apakah ini lingkaran osu! (bukan noise)
                confidence = self._calculate_confidence(frame, x, y, r)
                if confidence > self.CIRCLE_THRESHOLD:
                    detected.append(Circle(
                        x=x,
                        y=y,
                        radius=r,
                        approach_radius=r * 1.5,  # Approach circle lebih besar
                        timestamp=time.time(),
                        confidence=confidence
                    ))
        
        return detected
    
    def _calculate_confidence(self, frame: np.ndarray, x: int, y: int, r: int) -> float:
        """Hitung confidence score untuk deteksi"""
        # Crop area around circle
        y1, y2 = max(0, y - r), min(frame.shape[0], y + r)
        x1, x2 = max(0, x - r), min(frame.shape[1], x + r)
        roi = frame[y1:y2, x1:x2]
        
        if roi.size == 0:
            return 0.0
        
        # Hitung warna dominan
        mean_color = np.mean(roi, axis=(0, 1))
        color_diff = np.linalg.norm(mean_color - self.CIRCLE_COLOR)
        
        # Normalize confidence (0-1)
        confidence = max(0, 1 - (color_diff / 255))
        return confidence
    
    def get_active_circles(self, timeout: float = 2.0) -> List[Circle]:
        """Dapatkan lingkaran yang aktif (dalam timeframe tertentu)"""
        frame = self.capture_screen()
        circles = self.detect_circles(frame)
        
        # Filter lingkaran yang masih aktif (belum lewat 2 detik)
        now = time.time()
        active = [c for c in circles if now - c.timestamp < timeout]
        
        return active
    
    def draw_debug(self, frame: np.ndarray, circles: List[Circle]) -> np.ndarray:
        """Gambar overlay debug pada frame"""
        debug_frame = frame.copy()
        
        for circle in circles:
            # Gambar lingkaran utama
            cv2.circle(debug_frame, (circle.x, circle.y), circle.radius, (0, 255, 0), 2)
            # Gambar approach circle
            cv2.circle(debug_frame, (circle.x, circle.y), int(circle.approach_radius), (0, 0, 255), 1)
            # Tampilkan confidence
            cv2.putText(
                debug_frame,
                f"{circle.confidence:.2f}",
                (circle.x - 20, circle.y - circle.radius - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )
        
        return debug_frame

class OsuController:
    def __init__(self):
        try:
            import pydirectinput as pyinput
            self.input = pyinput
            self.input.FAILSAFE = False
        except ImportError:
            import pyautogui as pyinput
            self.input = pyinput
            self.input.FAILSAFE = False
        
    def click(self, x: int, y: int):
        """Klik pada posisi tertentu"""
        self.input.click(x, y)
    
    def hold_and_release(self, x: int, y: int, hold_time: float = 0.1):
        """Hold dan release slider"""
        self.input.moveTo(x, y)
        self.input.mouseDown()
        time.sleep(hold_time)
        self.input.mouseUp()
    
    def key_press(self, key: str):
        """Press keyboard key (z/x untuk osu!)"""
        self.input.press(key)