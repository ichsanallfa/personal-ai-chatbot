import { useState } from "react";
import { authApi } from "../services/api.js";

export function OwnerLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.loginOwner(secretKey);
      if (res.data?.token) {
        localStorage.setItem("lucy_auth_token", res.data.token);
        if (res.data.user?.userId) {
          localStorage.setItem("lucy_user_id", res.data.user.userId);
        }
        onLoginSuccess(res.data.user);
        setSecretKey("");
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || "Login owner gagal. Cek secret key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Login Owner Lucy</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <p className="modal-desc">Masukkan OWNER_SECRET_KEY untuk akses penuh kontrol Lucy.</p>
          {error && <div className="alert-error">{error}</div>}
          <div className="form-group">
            <label htmlFor="owner-key">Secret Key</label>
            <input
              id="owner-key"
              type="password"
              placeholder="Masukkan secret key..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="action-button secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="action-button primary" disabled={loading}>
              {loading ? "Memverifikasi..." : "Masuk sebagai Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
