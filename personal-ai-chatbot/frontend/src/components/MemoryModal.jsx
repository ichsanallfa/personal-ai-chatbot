import { useState, useEffect } from "react";
import { memoryApi } from "../services/api.js";

export function MemoryModal({ isOpen, onClose, isOwner }) {
  const [activeTab, setActiveTab] = useState("user");
  const [userMemory, setUserMemory] = useState([]);
  const [coreMemory, setCoreMemory] = useState(null);
  const [temporaryMemory, setTemporaryMemory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const loadMemory = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "user") {
          const res = await memoryApi.getUserMemory();
          if (mounted) setUserMemory(res.data?.items || []);
        } else if (activeTab === "core" && isOwner) {
          const res = await memoryApi.getCoreMemory();
          if (mounted) setCoreMemory(res.data || null);
        } else if (activeTab === "temporary") {
          const res = await memoryApi.getTemporaryMemory();
          if (mounted) setTemporaryMemory(res.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.error?.message || "Gagal memuat memori.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMemory();
    return () => {
      mounted = false;
    };
  }, [isOpen, activeTab, isOwner]);

  const handleDeleteUserMemory = async (id) => {
    try {
      await memoryApi.deleteUserMemory(id);
      setUserMemory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.error?.message || "Gagal menghapus memori.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>🧠 Pusat Memori Lucy</h3>
          <button type="button" className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="memory-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === "user" ? "active" : ""}`}
            onClick={() => setActiveTab("user")}
          >
            Fakta Pengguna
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "temporary" ? "active" : ""}`}
            onClick={() => setActiveTab("temporary")}
          >
            Memori Sementara (2 Jam)
          </button>
          {isOwner && (
            <button
              type="button"
              className={`tab-btn ${activeTab === "core" ? "active" : ""}`}
              onClick={() => setActiveTab("core")}
            >
              Core Memory (Owner)
            </button>
          )}
        </div>

        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}
          {loading ? (
            <p className="status">Memuat data memori...</p>
          ) : activeTab === "user" ? (
            <div className="memory-list">
              {userMemory.length === 0 ? (
                <p className="empty-state">Belum ada memori permanen tersimpan.</p>
              ) : (
                userMemory.map((item) => (
                  <div key={item.id} className="memory-item-card">
                    <div>
                      <span className="badge category-badge">[{item.category || "info"}]</span>
                      <p className="memory-content">{item.content}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => handleDeleteUserMemory(item.id)}
                      title="Hapus memori"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === "temporary" ? (
            <div className="memory-list">
              {temporaryMemory.length === 0 ? (
                <p className="empty-state">Tidak ada temporary memory aktif.</p>
              ) : (
                temporaryMemory.map((item) => (
                  <div key={item.id} className="memory-item-card">
                    <div>
                      <span className="badge">TTL: 2 Jam</span>
                      <p className="memory-content">{item.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="core-memory-view">
              {coreMemory ? (
                <div>
                  <h4>Identitas: {coreMemory.identity?.name}</h4>
                  <p><strong>Pencipta:</strong> {coreMemory.identity?.creator}</p>
                  <p><strong>Tujuan:</strong> {coreMemory.identity?.purpose}</p>
                  <h4>Kepribadian</h4>
                  <p><strong>Style:</strong> {coreMemory.personality?.style}</p>
                  <p><strong>Tone:</strong> {coreMemory.personality?.tone}</p>
                  <h4>Aturan Keamanan</h4>
                  <ul>
                    {coreMemory.rules?.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="empty-state">Data Core Memory tidak tersedia.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
