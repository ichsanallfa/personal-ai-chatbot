import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const cleanTextForSpeech = (text) => {
    return text
      .replace(/```[\s\S]*?```/g, "Ada bagian kode yang saya tampilkan di layar.")
      .replace(/[#_*`>-]/g, "")
      .replace(/\n/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const speakText = (text) => {
    if (!voiceEnabled) return;

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
      const response = await axios.post("http://localhost:3001/chat", {
        message: trimmedMessage,
      });

      const aiMessage = {
        role: "assistant",
        content: response.data.reply,
      };

      appendMessage(aiMessage);
      speakText(response.data.reply);
    } catch (error) {
      console.error(error);
      appendMessage({ role: "assistant", content: "Error connecting to AI" });
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
              onClick={() => window.speechSynthesis.cancel()}
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