import { useState, useEffect } from "react";
import { vtubeApi } from "../services/api.js";

const EXPRESSIONS = [
  { id: "senang", label: "😊 Senang" },
  { id: "sedih", label: "😢 Sedih" },
  { id: "marah", label: "😠 Marah" },
  { id: "terkejut", label: "😲 Terkejut" },
  { id: "berpikir", label: "🤔 Berpikir" },
  { id: "netral", label: "😐 Netral" },
];

export function VTubeModal({ isOpen, onClose, isOwner }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const loadStatus = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await vtubeApi.getStatus();
        if (mounted) {
          setStatus(res.data || null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error?.message || "Gagal menghubungi backend VTube.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStatus();
    return () => {
      mounted = false;
    };
  }, [isOpen, refreshKey]);

  const handleTrigger = async (expression) => {
    setTriggerMsg("");
    setError("");
    try {
      await vtubeApi.triggerExpression(expression);
      setTriggerMsg(`Ekspresi "${expression}" berhasil dipicu!`);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Gagal memicu ekspresi. Pastikan VTube Studio aktif.");
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    setTriggerMsg("");
    setError("");
    try {
      await vtubeApi.reconnect();
      setTriggerMsg("Permintaan rekoneksi dikirim.");
      setTimeout(() => setRefreshKey((k) => k + 1), 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Gagal rekoneksi.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>🎭 Integrasi VTube Studio</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {triggerMsg && <div className="alert-success">{triggerMsg}</div>}
          {error && <div className="alert-error">{error}</div>}

          <div className="vtube-status-box">
            <h4>Status Koneksi Avatar</h4>
            {loading ? (
              <p className="status">Memeriksa status...</p>
            ) : status ? (
              <div>
                <p>
                  Status:{" "}
                  <span className={`status-pill ${status.connected ? "connected" : "disconnected"}`}>
                    {status.connected ? "🟢 Terhubung" : "🔴 Terputus"}
                  </span>
                </p>
                <p>Autentikasi: {status.authenticated ? "✅ Terverifikasi" : "❌ Belum Auth"}</p>
                <p>WebSocket: {status.endpoint || "ws://127.0.0.1:8001"}</p>
              </div>
            ) : (
              <p className="empty-state">Data status belum terbaca.</p>
            )}

            {isOwner && (
              <button
                type="button"
                className="action-button secondary btn-sm"
                onClick={handleReconnect}
                disabled={loading}
              >
                🔄 Hubungkan Ulang
              </button>
            )}
          </div>

          <div className="expression-grid-section">
            <h4>Tes Trigger Ekspresi</h4>
            <div className="expression-buttons">
              {EXPRESSIONS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  className="action-button secondary"
                  onClick={() => handleTrigger(exp.id)}
                >
                  {exp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
