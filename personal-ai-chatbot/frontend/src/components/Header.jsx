export function Header({
  user,
  voiceEnabled,
  onToggleVoice,
  onStopVoice,
  onOpenOwnerModal,
  onLogout,
  onOpenReminders,
  onOpenMemory,
  onOpenVTube,
}) {
  const isOwner = user?.role === "owner";

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-title-wrap">
          <h1>🤖 Lucy AI Assistant</h1>
          <span className={`user-badge ${isOwner ? "badge-owner" : "badge-guest"}`}>
            {isOwner ? "👑 Owner (Alfaa)" : "👤 Guest User"}
          </span>
        </div>
        <p className="header-subtitle">Multi-Platform Assistant • Web, Discord, Telegram & VTube</p>
      </div>

      <div className="app-actions">
        <button
          type="button"
          onClick={onOpenReminders}
          className="action-button secondary"
          title="Buka pengingat"
        >
          ⏰ Reminders
        </button>

        <button
          type="button"
          onClick={onOpenMemory}
          className="action-button secondary"
          title="Buka data memori"
        >
          🧠 Memori
        </button>

        <button
          type="button"
          onClick={onOpenVTube}
          className="action-button secondary"
          title="Status VTube Studio"
        >
          🎭 VTube
        </button>

        {/* Voice controls disabled - hardware limitation (iGPU)
        <button
          type="button"
          onClick={onToggleVoice}
          className={`action-button ${voiceEnabled ? "primary" : "secondary"}`}
          title="Toggle text-to-speech"
        >
          Voice: {voiceEnabled ? "ON" : "OFF"}
        </button>

        {voiceEnabled && (
          <button
            type="button"
            onClick={onStopVoice}
            className="action-button danger"
            title="Hentikan suara"
          >
            ⏹️ Stop
          </button>
        )}
        */}

        {isOwner ? (
          <button
            type="button"
            onClick={onLogout}
            className="action-button outline"
            title="Logout dari role owner"
          >
            Logout Owner
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenOwnerModal}
            className="action-button owner-btn"
            title="Login sebagai Owner"
          >
            👑 Owner Login
          </button>
        )}
      </div>
    </header>
  );
}
