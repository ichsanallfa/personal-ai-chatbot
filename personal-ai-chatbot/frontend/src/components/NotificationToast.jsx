import { useState, useEffect } from "react";
import { reminderApi } from "../services/api.js";

export function NotificationToast({ onSpeak }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const res = await reminderApi.getNotifications();
        if (mounted && res.data && res.data.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newItems = res.data.filter((n) => !existingIds.has(n.id));
            if (newItems.length > 0 && onSpeak) {
              newItems.forEach((item) => onSpeak(item.message));
            }
            return [...prev, ...newItems];
          });
        }
      } catch {
        // Ignore background polling errors
      }
    };

    poll();
    const interval = setInterval(poll, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [onSpeak]);

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map((n) => (
        <div key={n.id} className="toast-card">
          <div className="toast-content">
            <span className="toast-icon">⏰</span>
            <p className="toast-message">{n.message}</p>
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => dismissNotification(n.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
