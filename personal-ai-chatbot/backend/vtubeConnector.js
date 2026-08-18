import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================
// VTube Studio WebSocket Connector
// ============================================
// Menghubungkan AI Lucy ke VTube Studio agar
// avatar bisa berekspresi sesuai emosi.
//
// Cara pakai:
// 1. Buka VTube Studio
// 2. Aktifkan Plugin API
//    Settings > Plugin API > Enable
// 3. Pastikan WebSocket port = 8001
// 4. Jalankan server.js
// ============================================

const VTUBE_WS_URL = "ws://127.0.0.1:8001";

// Gunakan pluginName yang sama dengan vts.js
const PLUGIN_NAME = "Lucy AI";
const PLUGIN_DEVELOPER = "Alfaa";

// ============================================
// TOKEN STORAGE
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File token berada di root project
const TOKEN_FILE = path.resolve(__dirname, "../vts-auth-token.txt");

const getStoredToken = () => {
  try {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  } catch {
    return "";
  }
};

const setStoredToken = (token) => {
  try {
    fs.writeFileSync(TOKEN_FILE, token, "utf8");
  } catch (error) {
    console.warn("⚠️ Gagal menyimpan token:", error.message);
  }
};

let VTUBE_AUTH_TOKEN = getStoredToken();

// ============================================
// CONNECTION STATE
// ============================================

let ws = null;
let connected = false;
let authenticated = false;

// ============================================
// CONNECT TO VTUBE STUDIO
// ============================================

const connectVTube = () => {
  if (connected && ws?.readyState === WebSocket.OPEN) {
    return;
  }

  try {
    ws = new WebSocket(VTUBE_WS_URL);

    // ========================================
    // CONNECTION OPEN
    // ========================================

    ws.on("open", () => {
      connected = true;

      console.log("✅ VTube Studio connected (port 8001)");

      // ======================================
      // REQUEST NEW AUTHENTICATION TOKEN
      // ======================================

      sendVTubeRequest("AuthenticationTokenRequest", {
        pluginName: PLUGIN_NAME,
        pluginDeveloper: PLUGIN_DEVELOPER,
      });
    });

    // ========================================
    // RECEIVE MESSAGE
    // ========================================

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        handleVTubeMessage(message);
      } catch (error) {
        console.error(
          "❌ VTube message parse error:",
          error.message
        );
      }
    });

    // ========================================
    // CONNECTION ERROR
    // ========================================

    ws.on("error", (error) => {
      console.log(
        "⚠️ VTube Studio tidak terhubung. Avatar mode off."
      );

      console.error("VTube WebSocket error:", error.message);

      connected = false;
      authenticated = false;
    });

    // ========================================
    // CONNECTION CLOSED
    // ========================================

    ws.on("close", () => {
      console.log("❌ VTube Studio connection closed");

      connected = false;
      authenticated = false;
      ws = null;
    });

  } catch (error) {
    console.log(
      "⚠️ VTube Studio tidak tersedia:",
      error.message
    );

    connected = false;
    authenticated = false;
  }
};

// ============================================
// HANDLE VTUBE STUDIO MESSAGE
// ============================================

const handleVTubeMessage = (message) => {

  // ==========================================
  // AUTHENTICATION TOKEN RESPONSE
  // ==========================================

  if (message.messageType === "AuthenticationTokenResponse") {

    const newToken = message.data?.authenticationToken;

    if (!newToken) {
      console.error(
        "❌ VTube Studio tidak memberikan authentication token."
      );

      return;
    }

    // Simpan token
    VTUBE_AUTH_TOKEN = newToken;

    setStoredToken(newToken);

    console.log(
      "🎫 Token VTube Studio didapat, mencoba autentikasi..."
    );

    // ========================================
    // AUTHENTICATION REQUEST
    // ========================================
    //
    // PENTING:
    // Field yang benar adalah:
    // authenticationToken
    //
    // BUKAN:
    // authToken
    // ========================================

    sendVTubeRequest("AuthenticationRequest", {
      pluginName: PLUGIN_NAME,
      pluginDeveloper: PLUGIN_DEVELOPER,
      pluginIcon: "",
      authenticationToken: newToken,
    });

    return;
  }

  // ==========================================
  // AUTHENTICATION RESPONSE
  // ==========================================

  if (message.messageType === "AuthenticationResponse") {

    if (message.data?.authenticated) {

      authenticated = true;

      console.log(
        "✅ VTube Studio autentikasi berhasil!"
      );

      // Setelah autentikasi berhasil, ambil daftar ekspresi
      getAvailableExpressions();

    } else {

      authenticated = false;

      console.log(
        "⚠️ Plugin belum di-trust di VTube Studio."
      );

      console.log(
        "➡️ Buka VTube Studio > Settings > Plugin API"
      );

      console.log(
        "➡️ Izinkan/trust plugin 'Lucy AI'"
      );

      console.log(
        "➡️ Kemudian restart server."
      );
    }

    return;
  }

  // ==========================================
  // EXPRESSION STATE RESPONSE
  // ==========================================

  if (message.messageType === "ExpressionStateResponse") {

    const expressions = message.data?.expressions || [];

    console.log(
      `🎭 Ekspresi tersedia (${expressions.length}):`
    );

    expressions.forEach((exp) => {
      console.log(`   - ${exp.name} (${exp.file})`);
    });

    return;
  }

  // ==========================================
  // API ERROR
  // ==========================================

  if (message.messageType === "APIError") {

    console.error(
      "❌ VTube API Error:",
      message.data?.message || "Unknown error"
    );

    return;
  }
};

// ============================================
// SEND REQUEST TO VTUBE STUDIO
// ============================================

const sendVTubeRequest = (messageType, data = {}) => {

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn(
      "⚠️ Tidak bisa mengirim request: VTube Studio belum terhubung."
    );

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

// ============================================
// GET BASIC INFO
// ============================================

const getBasicInfo = () => {

  if (!authenticated) {
    console.warn(
      "⚠️ Belum terautentikasi dengan VTube Studio."
    );

    return;
  }

  sendVTubeRequest("StatisticsRequest");
};

// ============================================
// GET AVAILABLE EXPRESSIONS
// ============================================

const getAvailableExpressions = () => {

  if (!authenticated) {
    console.warn(
      "⚠️ Belum terautentikasi. Tidak dapat mengambil daftar ekspresi."
    );

    return;
  }

  sendVTubeRequest("ExpressionStateRequest");
};

// ============================================
// REQUEST EXPRESSION
// ============================================

let currentExpression = "";

const requestTrack = (trackName) => {

  if (!authenticated) {
    console.warn(
      "⚠️ Belum terautentikasi. Tidak dapat mengubah ekspresi."
    );

    return;
  }

  // Nonaktifkan ekspresi sebelumnya jika ada
  if (currentExpression && currentExpression !== trackName) {
    sendVTubeRequest("ExpressionActivationRequest", {
      expressionFile: currentExpression,
      active: false,
    });
  }

  // Aktifkan ekspresi baru
  sendVTubeRequest("ExpressionActivationRequest", {
    expressionFile: trackName,
    active: true,
  });

  currentExpression = trackName;

  // Otomatis kembalikan ke netral setelah 5 detik
  setTimeout(() => {
    if (currentExpression) {
      sendVTubeRequest("ExpressionActivationRequest", {
        expressionFile: currentExpression,
        active: false,
      });
      currentExpression = "";
    }
  }, 5000);
};

// ============================================
// EMOTION → AVATAR EXPRESSION
// ============================================

const EMOTION_EXPRESSIONS = {

  senang: "EyesLove.exp3.json",

  kesal: "SignAngry.exp3.json",

  sedih: "EyesCry.exp3.json",

  lucu: "SignShock.exp3.json",

  terima_kasih: "EyesLove.exp3.json",

  maaf: "EyesCry.exp3.json",

  netral: "",

};

// ============================================
// SET AVATAR EXPRESSION
// ============================================

export const setAvatarExpression = async (emotion) => {

  // Kalau belum connect, coba connect
  if (!connected) {

    connectVTube();

    return;
  }

  // Kalau sudah connect tapi belum authentication
  if (!authenticated) {

    console.warn(
      "⚠️ VTube Studio belum selesai autentikasi."
    );

    return;
  }

  const expression =
    EMOTION_EXPRESSIONS[emotion] || "";

  if (!expression) {
    console.log(
      `🎭 Lucy expression: ${emotion} → (netral, tidak ada ekspresi)`
    );

    return;
  }

  console.log(
    `🎭 Lucy expression: ${emotion} → ${expression}`
  );

  requestTrack(expression);
};

// ============================================
// INITIALIZE AVATAR
// ============================================

export const initializeAvatar = async () => {

  console.log(
    "🤖 Menghubungkan Lucy ke VTube Studio..."
  );

  connectVTube();
};

// ============================================
// EXPORT
// ============================================

export {
  connectVTube,
};