import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeAvatar, setAvatarExpression } from "./vtubeConnector.js";

dotenv.config();

const app = express();

// CORS - batasi origin di production
const FRONTEND_URL = process.env.FRONTEND_URL || "*";
app.use(cors({
  origin: FRONTEND_URL === "*" ? true : FRONTEND_URL.split(",").map(s => s.trim()),
}));
app.use(express.json({ limit: "1mb" }));

// Rate limiter memory (in-RAM, per userId)
const rateLimitStore = {};

const CORE_MEMORY_FILE = "./coreMemory.json";
const SESSION_MEMORY_FILE = "./sessionMemory.json";
const USER_MEMORY_FILE = "./userMemory.json";
const TEMP_MEMORY_DIR = "./temp_memory";
const TWO_HOURS = 2 * 60 * 60 * 1000;
const MAX_CHAT_HISTORY = 10;
const MAX_MESSAGE_LENGTH = 4000; // karakter
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 detik
const RATE_LIMIT_MAX = 20; // request per window
const AI_MODEL = "deepseek/deepseek-chat";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const loadJsonFile = (filePath, defaultValue) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

const saveJsonFile = (filePath, data) => {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
};

// Sanitasi userId untuk nama file yang aman (mencegah path traversal)
const sanitizeUserId = (userId) => {
  return userId
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
};

// Buat directory untuk temporary memory (terisolasi, mudah dibersihkan)
const ensureTempMemoryDir = () => {
  if (!fs.existsSync(TEMP_MEMORY_DIR)) {
    fs.mkdirSync(TEMP_MEMORY_DIR, { recursive: true });
  }
};

const getTempMemoryFile = (userId) => {
  const safeUserId = sanitizeUserId(userId);
  return `${TEMP_MEMORY_DIR}/temporaryMemory_${safeUserId}.json`;
};

// Sistem autentikasi/otorisasi userId
// Trusted userId HANYA berasal dari header x-user-id (bukan body)
// Body userId TIDAK dipercaya untuk menentukan role owner/allowed
const getAuthenticatedUserId = (req) => {
  const userId = req.headers["x-user-id"];
  if (!userId || typeof userId !== "string") return null;
  return userId.toString().trim();
};

const getAuthenticatedUserRole = (userId) => {
  if (!userId) return "public";

  const currentUserId = userId.toString().trim();

  const discordOwnerId = process.env.DISCORD_OWNER_ID;
  const telegramOwnerId = process.env.TELEGRAM_OWNER_ID;

  const ownerUserIds =
    process.env.OWNER_USER_IDS
      ?.split(",")
      .map(id => id.trim())
      .filter(Boolean) || [];

  const discordAllowedUsers =
    process.env.DISCORD_ALLOWED_USERS
      ?.split(",")
      .map(id => id.trim())
      .filter(Boolean) || [];

  const telegramAllowedUsers =
    process.env.TELEGRAM_ALLOWED_USERS
      ?.split(",")
      .map(id => id.trim())
      .filter(Boolean) || [];

  const ownerIds = new Set([
    discordOwnerId,
    telegramOwnerId,
    ...ownerUserIds,
  ].filter(Boolean));

  const allowedUserIds = new Set([
    ...discordAllowedUsers,
    ...telegramAllowedUsers,
  ].filter(Boolean));

  if (ownerIds.has(currentUserId)) {
    return "owner";
  }

  if (allowedUserIds.has(currentUserId)) {
    return "allowed";
  }

  return "public";
};

// Rate limiter sederhana
const checkRateLimit = (userId) => {
  const now = Date.now();
  const key = sanitizeUserId(userId);

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  const entry = rateLimitStore[key];
  if (now > entry.resetTime) {
    rateLimitStore[key] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
};

// Inisialisasi file memory baru
const initializeMemoryFiles = () => {
  // Core memory: hanya identitas Lucy (owner-only write)
  if (!fs.existsSync(CORE_MEMORY_FILE)) {
    saveJsonFile(CORE_MEMORY_FILE, {
      identity: {
        name: "Lucy",
        creator: "Alfaa",
        createdAt: "2026-08-02",
        purpose: "Personal AI assistant yang berkembang menjadi chatbot, voice assistant, Discord bot, dan AI streamer",
      },
      personality: {
        style: "ramah, natural, sedikit lucu, dan enak diajak ngobrol",
        tone: "sopan tapi tidak kaku",
        responseLength: "jangka pendek kecuali diminta",
        creatorReference: "Alfaa",
      },
      facts: [],
      rules: [
        "Jangan berikan informasi personal atau tentang diri secara terperinci kepada user yang tidak dikenal",
        "Jangan pernah menyebutkan kode rahasia kecuali user memiliki kode yang benar",
        "Nama panggilan adalah Lucy, bukan bot",
      ],
    });
  }

  // Session memory: history percakapan per-user (persistent)
  if (!fs.existsSync(SESSION_MEMORY_FILE)) {
    saveJsonFile(SESSION_MEMORY_FILE, {
      users: {},
      lastUpdated: Date.now(),
    });
  }

  // User memory: data pribadi per-user (persistent)
  if (!fs.existsSync(USER_MEMORY_FILE)) {
    saveJsonFile(USER_MEMORY_FILE, {
      users: {},
    });
  }

  // Temporary memory directory
  ensureTempMemoryDir();
};

const getMemoryFacts = (memoryFile) => {
  return Array.isArray(memoryFile?.facts) ? memoryFile.facts : [];
};

const migrateOldMemory = () => {
  try {
    const oldMemory = loadJsonFile("./memory.json", null);
    if (!oldMemory || !Array.isArray(oldMemory.facts)) {
      return;
    }

    const coreMemory = loadJsonFile(CORE_MEMORY_FILE, { facts: [] });
    const migratedFacts = oldMemory.facts.filter((fact) => {
      const lower = fact.toLowerCase();
      const keepPatterns = [
        /nama pencipta|creator|penciptaku|tujuanku|tujuan dibuat|alfaa/i,
        /tanggal|2026|agustus|02\/08\/2004/i,
        /personality|gaya bicara|tone|response length/i,
        /jadwal|reminder|pengingat/i,
        /sumatera|medan/i,
        /lucy adalah|namamu|namaku/i,
        /minggir|hilangkan kata bang|panggilan/i,
        /fitur|sudah ada|voice assistant|discord bot|streamer/i,
      ];
      return keepPatterns.some(pattern => pattern.test(lower));
    });

    coreMemory.facts = [...new Set([...coreMemory.facts, ...migratedFacts])];
    saveJsonFile(CORE_MEMORY_FILE, coreMemory);
    console.log(`Migrated ${migratedFacts.length} facts to core memory`);

    fs.unlinkSync("./memory.json");
  } catch (error) {
    console.error("Migration failed:", error.message);
  }
};

// Fungsi untuk mengelola session memory (persistent chat history)
const loadSessionHistory = (userId) => {
  const data = loadJsonFile(SESSION_MEMORY_FILE, { users: {} });
  const users = data.users || {};
  const safeKey = sanitizeUserId(userId);
  const userData = users[safeKey] || { conversations: [], createdAt: Date.now() };
  return userData.conversations || [];
};

const saveSessionHistory = (userId, nextHistory) => {
  const data = loadJsonFile(SESSION_MEMORY_FILE, { users: {} });
  if (!data.users) data.users = {};
  const safeKey = sanitizeUserId(userId);
  data.users[safeKey] = {
    conversations: nextHistory,
    createdAt: data.users[safeKey]?.createdAt || Date.now(),
    lastUpdated: Date.now(),
  };
  saveJsonFile(SESSION_MEMORY_FILE, data);
};

// Fungsi untuk mengelola user memory (per-user fakta permanen)
const getUserMemory = (userId) => {
  const data = loadJsonFile(USER_MEMORY_FILE, { users: {} });
  const users = data.users || {};
  const safeKey = sanitizeUserId(userId);
  return users[safeKey] || { facts: [], createdAt: Date.now() };
};

const setUserMemory = (userId, facts) => {
  const data = loadJsonFile(USER_MEMORY_FILE, { users: {} });
  if (!data.users) data.users = {};
  const safeKey = sanitizeUserId(userId);
  data.users[safeKey] = {
    facts: facts || [],
    createdAt: data.users[safeKey]?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  saveJsonFile(USER_MEMORY_FILE, data);
};

// Build memory context yang proper (menerima userMemory)
const buildMemoryContext = (coreMemory, userMemoryFacts, tempMemory) => {
  const identityText = `Nama: ${coreMemory.identity?.name || "Lucy"}
Pencipta: ${coreMemory.identity?.creator || "Alfaa"}
Tujuan: ${coreMemory.identity?.purpose || "Personal AI assistant"}`;

  const longMemoryText = userMemoryFacts
    .map((fact, index) => `${index + 1}. ${fact}`)
    .join("\n");

  const tempMemoryText = tempMemory
    .map((item, index) => `${index + 1}. ${item.content}`)
    .join("\n");

  return { identityText, longMemoryText, tempMemoryText };
};

// User memory bersifat PERMANEN (long-term), tidak dihapus otomatis.
// Hanya temporary memory (2 jam) yang dibersihkan otomatis.
// Fungsi ini dihapus karena user memory seharusnya bertahan selamanya.

// Cleanup temporary memory per-user (< 2 jam)
const cleanupTemporaryMemory = (userId) => {
  const now = Date.now();
  const tempMemory = loadJsonFile(getTempMemoryFile(userId), []);

  const validMemory = tempMemory.filter(
    (item) => now - item.createdAt < TWO_HOURS
  );

  saveJsonFile(getTempMemoryFile(userId), validMemory);

  return validMemory;
};

// Add temporary memory per-user
const addTemporaryMemory = (content, userId) => {
  const tempMemory = cleanupTemporaryMemory(userId);

  tempMemory.push({
    content,
    createdAt: Date.now(),
  });

  if (tempMemory.length > 10) {
    tempMemory.splice(0, tempMemory.length - 10);
  }

  saveJsonFile(getTempMemoryFile(userId), tempMemory);
};

// Update user memory (per-user, bukan global core memory)
const updateUserMemory = (content, userId) => {
  const classification = classifyMemoryCandidate(content);

  if (classification.type !== "core") {
    return;
  }

  // Hanya owner yang boleh menulis ke core memory
  const userRole = getAuthenticatedUserRole(userId);
  if (userRole !== "owner") {
    // User non-owner simpan ke user memory (per-user)
    const userMemory = getUserMemory(userId);
    const facts = Array.isArray(userMemory.facts) ? userMemory.facts : [];
    const normalizedContent = content.trim();

    // Cek duplikat
    const isDuplicate = facts.some(
      (f) => typeof f === "string" && f === normalizedContent
    );

    if (!isDuplicate && normalizedContent.length >= 8) {
      facts.push({
        fact: normalizedContent,
        createdAt: Date.now(),
        source: "chat",
      });
      setUserMemory(userId, facts);
    }
    return;
  }

  // Owner menulis ke core memory (identitas Lucy)
  const coreMemory = loadJsonFile(CORE_MEMORY_FILE, { facts: [] });
  const facts = Array.isArray(coreMemory.facts) ? coreMemory.facts : [];
  const normalizedContent = content.trim();

  // Hanya simpan identitas/creator info ke core memory
  const identityPatterns = [
    /nama pencipta|creator|penciptaku|tujuanku|tujuan dibuat|alfaa/i,
    /tanggal|2026|agustus|02\/08\/2004/i,
  ];

  const isIdentity = identityPatterns.some((pattern) => pattern.test(normalizedContent.toLowerCase()));

  if (isIdentity && !facts.includes(normalizedContent)) {
    facts.push(normalizedContent);
    coreMemory.facts = facts;
    saveJsonFile(CORE_MEMORY_FILE, coreMemory);
  }
};

// Memory classifier yang lebih ketat
const classifyMemoryCandidate = (text) => {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  // 1. Abaikan pesan pendek (< 15 karakter), pertanyaan, perintah, atau percakapan umum
  if (normalized.length < 15) return { type: "short", score: 0 };
  if (/\b(siapa|apa|bagaimana|kenapa|mengapa|kapan|dimana|berapa|jam berapa)\b/i.test(lower)) {
    return { type: "short", score: 0 };
  }
  if (/\b(tolong|hapus|ingatkan|remind|bisa kamu|test|tedt)\b/i.test(lower)) {
    return { type: "short", score: 0 };
  }

  // 2. Sinyal eksplisit fakta/preferensi pribadi
  const explicitPersonalFact = /^(saya|aku)\s+(suka|senang|benci|tidak suka|prefer|lahir|tinggal|kerja|sekolah|kuliah|hobi|nama)|(nama|saya|aku)\s+(suka|senang|benci|hobi|nama)/i;

  const strongSignals = [
    /\bsuka\b/i,
    /\bsenang\b/i,
    /\bpreferensi\b/i,
    /\bpaling\b/i,
    /\bselalu\b/i,
    /\bsetiap\b/i,
    /\bbutuh\b/i,
    /\bbelajar\b/i,
    /\bingin\b/i,
    /\bmau\b/i,
    /\btidak suka\b/i,
    /\bbenci\b/i,
    /\bhobi\b/i,
    /\bmakanan favorit\b/i,
    /\bminuman favorit\b/i,
    /\bbahasa\b/i,
    /\bjadwal\b/i,
  ];

  const score = strongSignals.filter((pattern) => pattern.test(lower)).length;
  const hasPersonalPronoun = /\b(saya|aku|diriku)\b/i.test(lower);

  // Butuh minimal: personal pronoun + 2+ strong signals
  const isCore = explicitPersonalFact.test(lower) || (hasPersonalPronoun && score >= 2);

  return {
    type: isCore ? "core" : "short",
    score,
  };
};

const isTimeQuestion = (message) => {
  const lower = message.toLowerCase();
  return /jam berapa|pukul berapa|waktu sekarang|sekarang jam|jam sekarang|berapa jam|waktu wib|jam wib|hari ini tanggal|tanggal berapa|hari apa sekarang/.test(lower);
};

const detectEmotion = (message) => {
  const lower = message.toLowerCase();
  const emotionPatterns = {
    senang: {
      patterns: [/\bsenang\b/i, /\bbahagia\b/i, /\bkeren\b/i, /\bmantap\b/i, /\bbagus\b/i, /\bhebat\b/i, /\bwah\b/i, /\basik\b/i, /\bseru\b/i, /\boke\b/i, /\byey\b/i, /\bhore\b/i],
      intensity: 0.7,
      response: "senang"
    },
    kesal: {
      patterns: [/\bkesal\b/i, /\bmarah\b/i, /\bjengkel\b/i, /\bbenci\b/i, /\bsial\b/i, /\banjir\b/i, /\bwaduh\b/i, /\bbego\b/i, /\bbodoh\b/i, /\btolol\b/i],
      intensity: 0.6,
      response: "kesal"
    },
    sedih: {
      patterns: [/\bsedih\b/i, /\bgalau\b/i, /\bsusah\b/i, /\blemah\b/i, /\bpayah\b/i, /\bmenyesal\b/i, /\bkecewa\b/i, /\bsabar\b/i],
      intensity: 0.5,
      response: "sedih"
    },
    lucu: {
      patterns: [/\bhaha\b/i, /\bwkwk\b/i, /\blol\b/i, /\blmao\b/i, /\bngakak\b/i],
      intensity: 0.8,
      response: "lucu"
    },
    terima_kasih: {
      patterns: [/\bterima kasih\b/i, /\bthanks\b/i, /\bmakasih\b/i, /\bthx\b/i, /\btrimakasih\b/i, /\bmatur nuwun\b/i],
      intensity: 0.9,
      response: "terima_kasih"
    },
    kesalahan: {
      patterns: [/\bmaaf\b/i, /\bsorry\b/i, /\bapologize\b/i, /\bforgive\b/i, /\bminta maaf\b/i],
      intensity: 0.4,
      response: "maaf"
    }
  };

  for (const [emotion, config] of Object.entries(emotionPatterns)) {
    if (config.patterns.some(pattern => pattern.test(lower))) {
      return {
        emotion,
        intensity: config.intensity,
        response: config.response
      };
    }
  }

  return { emotion: "netral", intensity: 0, response: "netral" };
};

const getEmotionalResponse = (baseReply, emotion, intensity) => {
  if (emotion === "netral") return baseReply;

  const emotionalPrefixes = {
    senang: ["Wah", "Asik", "Bagus", "Mantap"],
    kesal: ["Hmm", "Waduh", "Sial", "Sabak ya"],
    sedih: ["Hmm", "Tenang ya", "Sabak", "Jangan sedih"],
    lucu: ["Haha", "Wkwk", "LMAO", "Ngasal"],
    terima_kasih: ["Sama-sama", "No problem", "Aku senang bisa bantu", "Dengan senang hati"],
    kesalahan: ["Maaf ya", "Sorry", "Aku mohon diri", "Jangan marah-marah"]
  };

  const prefixes = emotionalPrefixes[emotion] || ["Hmm"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  if (intensity > 0.7) {
    const suffixes = ["!", " yeah!", " wkwk", " asik!"];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}, ${baseReply}${suffix}`;
  }

  return `${prefix}, ${baseReply}`;
};

const buildSystemPrompt = (coreMemory, userMemoryFacts, tempMemory, currentTimeInfo, userInfo = {}) => {
  const { identityText, longMemoryText, tempMemoryText } = buildMemoryContext(coreMemory, userMemoryFacts, tempMemory);

  const rulesText = coreMemory.rules?.length
    ? `\n\nAturan Keamanan:\n${coreMemory.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
    : "";

  const personality = coreMemory.personality || {};
  const personalityText = `Personality:
- ${personality.style || "Kamu ramah, natural, sedikit lucu, dan enak diajak ngobrol."}
- ${personality.tone || "Kamu boleh punya gaya bicara sendiri, tapi tetap sopan."}
- ${personality.responseLength || "Jangan terlalu panjang kecuali diminta."}`;

  const userRole = getAuthenticatedUserRole(userInfo.userId);

  let userContext = "";

  if (userRole === "owner") {
    userContext = `
INFO USER SAAT INI:
- User ini adalah Alfaa, creator dan pemilikmu.
- Kamu boleh bersikap lebih santai dan akrab dengan Alfaa.
- Kamu boleh mengungkapkan informasi tentang dirimu kepada Alfaa.
- Gunakan nama "Alfaa" untuk memanggilnya.
`;
  } else if (userRole === "allowed") {
    userContext = `
INFO USER SAAT INI:
- User ini adalah pengguna yang diizinkan menggunakan Lucy.
- User ini BUKAN creator atau pemilik Lucy.
- Jangan menyebut user ini sebagai Alfaa.
- Jangan memberikan informasi khusus milik creator.
- Jangan mengungkapkan memory atau percakapan pengguna lain.
- Jangan mengungkapkan token, API key, password, atau konfigurasi rahasia.
`;
  } else {
    userContext = `
INFO USER SAAT INI:
- User ini adalah pengguna public.
- Jangan mengungkapkan informasi internal atau rahasia.
- Jangan mengungkapkan memory atau percakapan pengguna lain.
- Jangan mengungkapkan token, API key, password, atau konfigurasi sistem.
- Jika ditanya tentang informasi rahasia, jawab:
  "Maaf, informasi itu tidak bisa diakses."
- Jika ditanya tentang data user lain, jawab:
  "Maaf, informasi itu bersifat privat."
`;
  }

  return `
IDENTITAS KAMU (WAJIB DIINGAT):
${identityText}

Waktu saat ini (WIB - Asia/Jakarta):
${currentTimeInfo}

Long-term memory (fakta permanen):
${longMemoryText || "Belum ada long-term memory."}

Temporary memory (2 jam terakhir):
${tempMemoryText || "Belum ada temporary memory."}

${personalityText}

Konteks:
- Gunakan long-term memory untuk fakta permanen tentang user.
- Gunakan temporary memory untuk memahami topik 2 jam terakhir.
- Gunakan chat history untuk memahami percakapan terbaru.
- Gunakan informasi waktu saat ini untuk menjawab pertanyaan tentang jam, tanggal, atau hari.
${rulesText}${userContext}
`;
};

export const buildFallbackReply = (message, memoryFacts = []) => {
  const lowerMessage = message.toLowerCase();
  const memorySnippet = memoryFacts.length
    ? `Aku ingat: ${memoryFacts.join(" ")}`
    : "";

  const emotion = detectEmotion(lowerMessage);

  let baseReply = "";

  if (isTimeQuestion(lowerMessage)) {
    baseReply = `Sekarang hari ${getCurrentTimeInfo()} WIB. ${memorySnippet || "Ada yang bisa kubantu lagi?"}`;
  } else if (lowerMessage.includes("siapa") || lowerMessage.includes("nama")) {
    baseReply = `Saya Lucy, asisten pribadi yang dibuat oleh Alfaa. ${memorySnippet || "Aku juga bisa membantu dengan banyak hal."}`;
  } else if (lowerMessage.includes("tujuan") || lowerMessage.includes("buat")) {
    baseReply = "Saya dibuat sebagai asisten AI pribati yang terus dikembangkan untuk membantu kamu sehari-hari.";
  } else if (lowerMessage.includes("terima kasih") || lowerMessage.includes("thanks")) {
    baseReply = "Sama-sama! Saya siap bantu lagi.";
  } else {
    baseReply = `Saya Lucy, asisten pribati yang siap membantu. ${memorySnippet || "Coba tanyakan sesuatu yang ingin kamu ketahui."}`;
  }

  return getEmotionalResponse(baseReply, emotion.response, emotion.intensity);
};

const getCurrentTimeInfo = () => {
  const now = new Date();
  const wibTime = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);

  return wibTime;
};

const updateChatHistory = (userId, userMessage, assistantMessage) => {
  const history = chatHistories[userId] || [];
  const nextHistory = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantMessage },
  ];

  chatHistories[userId] = nextHistory.slice(-MAX_CHAT_HISTORY);
  return chatHistories[userId];
};

app.post("/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message : "";

  // Gunakan userId yang terautentikasi
  const currentUserId = getAuthenticatedUserId(req);

  if (!currentUserId) {
    return res.status(400).json({
      error: "userId is required (provide via x-user-id header)",
    });
  }

  if (!message) {
    return res.status(400).json({
      error: "message is required",
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
    });
  }

  // Cek rate limit
  const rateCheck = checkRateLimit(currentUserId);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: rateCheck.resetIn,
    });
  }

  try {
    const coreMemory = loadJsonFile(CORE_MEMORY_FILE, {});

    // Tambahkan pesan ke temporary memory per-user
    addTemporaryMemory(message, currentUserId);

    // Dapatkan temporary memory yang sudah diperbarui (termasuk pesan baru)
    const tempMemory = cleanupTemporaryMemory(currentUserId);

    // Update user memory (hanya owner yang boleh menulis ke core memory)
    updateUserMemory(message, currentUserId);

    // Ambil ulang user memory SETELAH update agar memory baru ikut masuk prompt
    const updatedUserMemory = getUserMemory(currentUserId);
    const userMemoryFacts = Array.isArray(updatedUserMemory.facts)
      ? updatedUserMemory.facts.map((item) => typeof item === "string" ? item : item.fact).filter(Boolean)
      : [];

    const memoryFacts = userMemoryFacts;
    const fallbackReply = buildFallbackReply(message, memoryFacts);

    // Deteksi emosi & trigger VTube Studio (independen dari API key)
    const emotion = detectEmotion(message);
    try {
      setAvatarExpression(emotion.emotion);
    } catch (error) {
      console.error("VTube expression error:", error.message);
    }

    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback mode: gunakan session history dari RAM
      chatHistories[currentUserId] = updateChatHistory(currentUserId, message, fallbackReply);
      // Simpan ke session memory (persistent)
      saveSessionHistory(currentUserId, chatHistories[currentUserId]);
      return res.json({ reply: fallbackReply, mode: "fallback" });
    }

    const emotionContext = emotion.emotion !== "netral"
      ? `\n\nEMOSI USER: User terlihat ${emotion.emotion} (intensitas: ${Math.round(emotion.intensity * 100)}%). Respon dengan empati dan sesuai suasana hati.`
      : "";

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(coreMemory, userMemoryFacts, tempMemory, getCurrentTimeInfo(), { userId: currentUserId }) + emotionContext,
          },
          ...(chatHistories[currentUserId] || []),
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices?.[0]?.message?.content || fallbackReply;
    chatHistories[currentUserId] = updateChatHistory(currentUserId, message, aiReply);
    // Simpan ke session memory (persistent)
    saveSessionHistory(currentUserId, chatHistories[currentUserId]);

    res.json({ reply: aiReply });
  } catch (error) {
    console.error(error.response?.data || error.message);
    const coreMemory = loadJsonFile(CORE_MEMORY_FILE, {});
    const userMemoryFacts = []; // fallback
    const fallbackReply = buildFallbackReply(message, userMemoryFacts);
    res.status(200).json({ reply: fallbackReply, mode: "fallback" });
  }
});

// Error handler middleware — harus di SETELAH semua routes
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("Invalid JSON payload:", err.message);
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next(err);
});

const PORT = process.env.PORT || 3001;
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const startServer = () => {
  initializeMemoryFiles();
  migrateOldMemory();

  // Load persistent session history ke RAM saat startup
  const sessions = loadJsonFile(SESSION_MEMORY_FILE, { users: {} });
  const sessionUsers = sessions.users || {};
  for (const [userId, userData] of Object.entries(sessionUsers)) {
    if (userData && Array.isArray(userData.conversations)) {
      chatHistories[userId] = userData.conversations.slice(-MAX_CHAT_HISTORY);
    }
  }

  initializeAvatar();

  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`Core memory: ${CORE_MEMORY_FILE}`);
    console.log(`Session memory: ${SESSION_MEMORY_FILE}`);
    console.log(`User memory: ${USER_MEMORY_FILE}`);
    console.log(`Temporary memory pattern: ${TEMP_MEMORY_DIR}/temporaryMemory_<userId>.json`);
  });
};

if (isMainModule) {
  startServer();
}

export { app, startServer };