import { useEffect, useRef } from "react";

export function ChatWindow({ chat, loading, onSuggestionClick }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const renderContent = (content) => {
    if (!content) return null;

    // Simple markdown code block parser
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : "";
        const code = lang ? lines.slice(1).join("\n") : lines.join("\n");
        return (
          <pre key={index} className="code-block">
            {lang && <span className="code-lang">{lang}</span>}
            <code>{code}</code>
          </pre>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="chat-window">
      {chat.length === 0 ? (
        <div className="chat-empty">
          <h3>👋 Halo! Saya Lucy.</h3>
          <p>Asisten AI cerdas untuk menemani dan membantu aktivitas harianmu.</p>
          <div className="quick-suggestions">
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => onSuggestionClick("Siapa kamu dan apa kemampuanmu?")}
            >
              💡 Siapa kamu?
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => onSuggestionClick("Ingatkan saya 30 menit lagi untuk istirahat")}
            >
              ⏰ Ingatkan 30 menit lagi
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => onSuggestionClick("Tolong jelaskan konsep REST API dengan ringkas")}
            >
              📚 Jelaskan REST API
            </button>
          </div>
        </div>
      ) : (
        chat.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div key={`${msg.role}-${index}`} className={`message ${msg.role}`}>
              <div className="message-header-meta">
                <span className="message-role">{isUser ? "Kamu" : "Lucy AI"}</span>
                {msg.emotion && msg.emotion !== "netral" && (
                  <span className="emotion-pill">Emosi: {msg.emotion}</span>
                )}
                {msg.mode && msg.mode === "fallback" && (
                  <span className="mode-pill fallback">Offline Mode</span>
                )}
              </div>
              <div className="message-body">{renderContent(msg.content)}</div>
            </div>
          );
        })
      )}

      {loading && (
        <div className="message assistant loading-bubble">
          <span className="message-role">Lucy AI</span>
          <p className="status-dots">Lucy sedang berpikir<span>.</span><span>.</span><span>.</span></p>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
}
