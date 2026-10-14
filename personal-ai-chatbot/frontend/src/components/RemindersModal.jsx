import { useState, useEffect } from "react";
import { reminderApi } from "../services/api.js";

export function RemindersModal({ isOpen, onClose, isOwner }) {
  const [reminders, setReminders] = useState([]);
  const [naturalText, setNaturalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const loadReminders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await reminderApi.getReminders();
        if (mounted) {
          setReminders(res.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error?.message || "Gagal memuat reminder.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadReminders();
    return () => {
      mounted = false;
    };
  }, [isOpen, refreshKey]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!naturalText.trim()) return;
    setActionLoading(true);
    setMessage("");
    setError("");
    try {
      await reminderApi.createReminder({ naturalText: naturalText.trim() });
      setMessage("Reminder berhasil dibuat!");
      setNaturalText("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Gagal membuat reminder. Pastikan format waktu jelas.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await reminderApi.deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Gagal menghapus reminder.");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Yakin ingin menghapus semua reminder?")) return;
    try {
      await reminderApi.clearAll();
      setReminders([]);
      setMessage("Semua reminder berhasil dibersihkan.");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Gagal membersihkan reminder.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>⏰ Manajemen Reminder Lucy</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {message && <div className="alert-success">{message}</div>}
          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleCreate} className="reminder-form">
            <input
              type="text"
              placeholder="Contoh: ingatkan saya 15 menit lagi belajar coding"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              disabled={actionLoading}
            />
            <button type="submit" className="action-button primary" disabled={actionLoading || !naturalText.trim()}>
              {actionLoading ? "Menyimpan..." : "+ Tambah"}
            </button>
          </form>

          <div className="reminder-list-section">
            <div className="section-header-inline">
              <h4>Daftar Pengingat Aktif ({reminders.length})</h4>
              {isOwner && reminders.length > 0 && (
                <button type="button" className="action-button danger btn-sm" onClick={handleClearAll}>
                  Hapus Semua
                </button>
              )}
            </div>

            {loading ? (
              <p className="status">Memuat data reminder...</p>
            ) : reminders.length === 0 ? (
              <p className="empty-state">Belum ada reminder aktif.</p>
            ) : (
              <div className="reminder-items">
                {reminders.map((item) => {
                  const scheduleDate = new Date(item.scheduledAt);
                  return (
                    <div key={item.id} className="reminder-item-card">
                      <div className="reminder-info">
                        <span className="reminder-time">
                          📅 {scheduleDate.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                        </span>
                        <p className="reminder-text">{item.message}</p>
                        <span className="reminder-platform">Platform: {item.platform || "web"}</span>
                      </div>
                      <button
                        type="button"
                        className="btn-icon danger"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus reminder"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
