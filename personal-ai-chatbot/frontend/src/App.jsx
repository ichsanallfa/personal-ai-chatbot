import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { authApi, chatApi } from "./services/api.js";
import { Header } from "./components/Header.jsx";
import { ChatWindow } from "./components/ChatWindow.jsx";
import { Composer } from "./components/Composer.jsx";
import { OwnerLoginModal } from "./components/OwnerLoginModal.jsx";
import { RemindersModal } from "./components/RemindersModal.jsx";
import { MemoryModal } from "./components/MemoryModal.jsx";
import { VTubeModal } from "./components/VTubeModal.jsx";
import { NotificationToast } from "./components/NotificationToast.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Modals state
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showVTubeModal, setShowVTubeModal] = useState(false);

  // Clean text helper for speech synthesis
  const cleanTextForSpeech = (text) => {
    return (text || "")
      .replace(/```[\s\S]*?```/g, "Ada bagian kode yang saya tampilkan di layar.")
      .replace(/[#_*`>-]/g, "")
      .replace(/\n/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const clean = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled]
  );

  // Initialize session and load chat history
  useEffect(() => {
    const initApp = async () => {
      try {
        const storedToken = localStorage.getItem("lucy_auth_token");
        let activeUser = null;

        if (storedToken) {
          try {
            const meRes = await authApi.getMe();
            activeUser = meRes.data?.user || null;
            setUser(activeUser);
          } catch {
            localStorage.removeItem("lucy_auth_token");
          }
        }

        if (!activeUser) {
          const storedUserId = localStorage.getItem("lucy_user_id") || undefined;
          const sessionRes = await authApi.initSession(storedUserId);
          if (sessionRes.data?.token) {
            localStorage.setItem("lucy_auth_token", sessionRes.data.token);
            if (sessionRes.data.user?.userId) {
              localStorage.setItem("lucy_user_id", sessionRes.data.user.userId);
            }
            setUser(sessionRes.data.user);
          }
        }

        // Fetch persisted conversation history
        const historyRes = await chatApi.getHistory();
        if (historyRes.data?.history && Array.isArray(historyRes.data.history)) {
          setChat(historyRes.data.history);
        }
      } catch (err) {
        console.warn("Error initializing app state:", err.message);
      }
    };

    initApp();
  }, []);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", content: trimmed };
    setChat((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(trimmed);
      const reply = res.data?.reply || res.data?.data?.reply || "Lucy tidak memberikan balasan.";
      const emotion = res.data?.emotion || res.data?.data?.emotion || "netral";
      const mode = res.data?.mode || res.data?.data?.mode || "normal";

      const aiMessage = {
        role: "assistant",
        content: reply,
        emotion,
        mode,
      };

      setChat((prev) => [...prev, aiMessage]);
      speakText(reply);
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || "Gagal menghubungi Lucy AI.";
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${errMsg}`, mode: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Hapus seluruh percakapan sesi ini?")) return;
    try {
      await chatApi.clearHistory();
      setChat([]);
    } catch (err) {
      alert("Gagal menghapus riwayat chat: " + err.message);
    }
  };

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setShowOwnerModal(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("lucy_auth_token");
    const storedUserId = localStorage.getItem("lucy_user_id") || undefined;
    try {
      const sessionRes = await authApi.initSession(storedUserId);
      if (sessionRes.data?.token) {
        localStorage.setItem("lucy_auth_token", sessionRes.data.token);
        setUser(sessionRes.data.user);
      }
    } catch {
      setUser(null);
    }
  };

  return (
    <div className="app-shell">
      <NotificationToast onSpeak={speakText} />

      <div className="app-card">
        <Header
          user={user}
          voiceEnabled={voiceEnabled}
          onToggleVoice={() => setVoiceEnabled((prev) => !prev)}
          onStopVoice={() => window.speechSynthesis?.cancel()}
          onOpenOwnerModal={() => setShowOwnerModal(true)}
          onLogout={handleLogout}
          onOpenReminders={() => setShowRemindersModal(true)}
          onOpenMemory={() => setShowMemoryModal(true)}
          onOpenVTube={() => setShowVTubeModal(true)}
        />

        <ChatWindow
          chat={chat}
          loading={loading}
          onSuggestionClick={(prompt) => {
            setMessage(prompt);
          }}
        />

        <Composer
          message={message}
          onChangeMessage={setMessage}
          onSubmit={handleSendMessage}
          onClearHistory={handleClearHistory}
          loading={loading}
          hasChat={chat.length > 0}
        />
      </div>

      <OwnerLoginModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <RemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        isOwner={user?.role === "owner"}
      />

      <MemoryModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        isOwner={user?.role === "owner"}
      />

      <VTubeModal
        isOpen={showVTubeModal}
        onClose={() => setShowVTubeModal(false)}
        isOwner={user?.role === "owner"}
      />
    </div>
  );
}

export default App;