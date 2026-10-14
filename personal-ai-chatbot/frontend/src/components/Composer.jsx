export function Composer({
  message,
  onChangeMessage,
  onSubmit,
  onClearHistory,
  loading,
  hasChat,
}) {
  return (
    <footer className="composer-container">
      <form className="composer" onSubmit={onSubmit}>
        <input
          type="text"
          value={message}
          onChange={(e) => onChangeMessage(e.target.value)}
          placeholder="Ketik pesan untuk Lucy... (contoh: ingat hobi saya main piano)"
          disabled={loading}
          autoFocus
        />

        <div className="composer-button-group">
          <button
            type="submit"
            className="action-button primary"
            disabled={loading || !message.trim()}
          >
            {loading ? "Mengirim..." : "Kirim 🚀"}
          </button>

          {hasChat && (
            <button
              type="button"
              className="action-button outline btn-clear"
              onClick={onClearHistory}
              disabled={loading}
              title="Bersihkan riwayat percakapan"
            >
              🧹 Hapus Chat
            </button>
          )}
        </div>
      </form>
    </footer>
  );
}
