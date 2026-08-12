import WebSocket from "ws";

// ============================================
// VTube Studio WebSocket Connector
// ============================================
// Menghubungkan AI Lucy ke VTube Studio agar
// avatar bisa berekspresi sesuai emosi.
//
// Cara pakai:
// 1. Buka VTube Studio
// 2. Aktifkan Plugin API (Settings > Plugin API > Enable)
// 3. Catat WebSocket port (default 8001)
// 4. Jalankan server.js
// ============================================

const VTUBE_WS_URL = "ws://127.0.0.1:8001";
const VTUBE_AUTH_TOKEN = ""; // Isi token dari VTube Studio jika diminta
const PLUGIN_NAME = "Lucy AI Assistant";

let ws = null;
let connected = false;
let pluginToken = "";

const connectVTube = () => {
  if (connected) {
    return;
  }

  try {
    ws = new WebSocket(VTUBE_WS_URL);

    ws.on("open", () => {
      console.log("✅ VTube Studio connected (port 8001)");
      connected = true;

      // Auth request
      sendVTubeRequest("AuthenticationRequest", {
        pluginName: PLUGIN_NAME,
        pluginDeveloper: "Alfaa",
        pluginIcon: "",
        authToken: VTUBE_AUTH_TOKEN,
      });
    });

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleVTubeMessage(message);
      } catch (error) {
        console.error("VTube message parse error:", error.message);
      }
    });

    ws.on("error", (error) => {
      console.log("⚠️ VTube Studio tidak terhubung. Avatar mode off.");
      connected = false;
    });

    ws.on("close", () => {
      console.log("❌ VTube Studio connection closed");
      connected = false;
      ws = null;
    });
  } catch (error) {
    console.log("⚠️ VTube Studio tidak tersedia:", error.message);
  }
};

const handleVTubeMessage = (message) => {
  if (message.messageType === "AuthenticationResponse") {
    if (message.data?.authenticated) {
      pluginToken = message.data.authenticationToken;
      console.log("✅ VTube Studio autentikasi berhasil");
    } else {
      console.log("⚠️ VTube Studio meminta token, isi VTUBE_AUTH_TOKEN di vtubeConnector.js");
    }
  }

  if (message.messageType === "APIError") {
    console.error("VTube API Error:", message.data?.message);
  }
};

const sendVTubeRequest = (messageType, data = {}) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }

  const request = {
    apiName: "VTubeStudioPublicAPI",
    apiVersion: "1.0",
    requestID: `lucy-${Date.now()}`,
    messageType,
    data,
  };

  ws.send(JSON.stringify(request));
};

const getBasicInfo = () => {
  sendVTubeRequest("GetStatistics");
};

const requestTrack = (trackName) => {
  sendVTubeRequest("ExpressionRequest", {
    expressionFile: trackName,
    active: true,
  });
};

// ============================================
// Ekspresi Avatar Berdasarkan Emosi Lucy
// ============================================
const EMOTION_EXPRESSIONS = {
  senang: "Happy",
  kesal: "Angry",
  sedih: "Sad",
  lucu: "Laughing",
  terima_kasih: "Happy",
  maaf: "Sad",
  netral: "Neutral",
};

export const setAvatarExpression = async (emotion) => {
  if (!connected) {
    // Coba konek ulang saat dibutuhkan
    connectVTube();
  }

  const expression = EMOTION_EXPRESSIONS[emotion] || "Neutral";
  requestTrack(expression);
};

export const initializeAvatar = async () => {
  connectVTube();
};

export { connectVTube, getBasicInfo };