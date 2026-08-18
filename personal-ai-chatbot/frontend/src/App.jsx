import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem("lucy_auth_token") || "");
  const chatEndRef = useRef(null);

  // Initialize or fetch session token
  useEffect(() => {
    const initSession = async () => {
      try {
        if (!token) {
          const storedUserId = localStorage.getItem("lucy_user_id");
          const res = await axios.post(`${API_BASE}/api/auth/session`, {
            userId: storedUserId || undefined,
          });
          if (res.data?.data?.token) {
            setToken(res.data.data.token);
            localStorage.setItem("lucy_auth_token", res.data.data.token);
            if (res.data.data.user?.userId) {
              localStorage.setItem("lucy_user_id", res.data.data.user.userId);
            }
          }
        }
      } catch (err) {
        console.warn("Could not obtain auth session token, using fallback headers:", err.message);
      }
    };
    initSession();
  }, [token]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const cleanTextForSpeech = (text) => {
    return (text || "")
      .replace(/```[\s\S]*?```/g, "Ada bagian kode yang saya tampilkan di layar.")
      .replace(/[#_*`>-]/g, "")
      .replace(/\n/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = "id-ID";
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  const appendMessage = (newMessage) => {
    setChat((prev) => [...prev, newMessage]);
  };

  const sendMessage = async (event) => {
    event?.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    appendMessage({ role: "user", content: trimmedMessage });
    setMessage("");
    setLoading(true);

    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        const storedUserId = localStorage.getItem("lucy_user_id") || "web_user";
        headers["x-user-id"] = storedUserId;
      }

      const response = await axios.post(
        `${API_BASE}/api/chat`,
        {
          message: trimmedMessage,
        },
        { headers }
      );

      const reply = response.data?.data?.reply || response.data?.reply || "Lucy tidak memberikan respon.";

      const aiMessage = {
        role: "assistant",
        content: reply,
      };

      appendMessage(aiMessage);
      speakText(reply);
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error?.message || "Error connecting to AI";
      appendMessage({ role: "assistant", content: `⚠️ ${errMsg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <div className="app-header">
          <div>
            <h1>Personal AI Assistant</h1>
            <p>Chat santai dengan Lucy.</p>
          </div>

          <div className="app-actions">
            <button
              type="button"
              onClick={() => setVoiceEnabled((prev) => !prev)}
              className={`action-button ${voiceEnabled ? "primary" : "secondary"}`}
            >
              Voice: {voiceEnabled ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={() => window.speechSynthesis?.cancel()}
              className="action-button danger"
            >
              Stop Voice
            </button>
          </div>
        </div>

        <div className="chat-window">
          {chat.map((msg, index) => (
            <div key={`${msg.role}-${index}`} className={`message ${msg.role}`}>
              <span className="message-role">{msg.role}</span>
              <p>{msg.content}</p>
            </div>
          ))}

          {loading && <p className="status">AI is thinking...</p>}
          <div ref={chatEndRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type message..."
          />

          <button type="submit" className="action-button primary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;