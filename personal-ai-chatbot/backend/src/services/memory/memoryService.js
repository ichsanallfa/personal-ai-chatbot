import fs from "fs";
import path from "path";
import {
  CORE_MEMORY_FILE,
  USER_MEMORY_FILE,
  SESSION_MEMORY_FILE,
  REMINDERS_FILE,
  BACKEND_ROOT,
  getTempMemoryFilePath,
  ensureDataDirectories,
} from "../../config/paths.js";
import { CHAT_LIMITS, MEMORY_CATEGORIES } from "../../config/constants.js";
import { loadJsonFile, saveJsonFile } from "../../storage/jsonStorage.js";
import { classifyMemoryCandidate, normalizeForCompare } from "./memoryClassifier.js";
import { logger } from "../../utils/logger.js";

class MemoryService {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    ensureDataDirectories();

    // 1. Initialize Core Memory
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
        facts: [
          "Nama penciptaku adalah Alfaa.",
          "Lucy diciptakan pada tanggal 2 Agustus 2026.",
          "Lucy memiliki kemampuan voice assistant, Discord bot, Telegram bot, dan streamer VTube Studio.",
        ],
        rules: [
          "Jangan berikan informasi personal atau tentang diri secara terperinci kepada user yang tidak dikenal",
          "Jangan pernah menyebutkan kode rahasia atau token internal",
          "Nama panggilan adalah Lucy, bukan bot",
        ],
      });
    }

    // 2. Initialize User Memory
    if (!fs.existsSync(USER_MEMORY_FILE)) {
      saveJsonFile(USER_MEMORY_FILE, { users: {} });
    }

    // 3. Initialize Session Memory
    if (!fs.existsSync(SESSION_MEMORY_FILE)) {
      saveJsonFile(SESSION_MEMORY_FILE, { users: {} });
    }

    this.migrateLegacyFiles();
    this.initialized = true;
    logger.info("Memory service initialized successfully.");
  }

  migrateLegacyFiles() {
    try {
      // Migrate from old backend root files if they exist and data folder doesn't have them
      const legacyCore = path.resolve(BACKEND_ROOT, "coreMemory.json");
      if (fs.existsSync(legacyCore) && legacyCore !== CORE_MEMORY_FILE) {
        const oldData = loadJsonFile(legacyCore);
        if (oldData) saveJsonFile(CORE_MEMORY_FILE, oldData);
      }

      const legacyUser = path.resolve(BACKEND_ROOT, "userMemory.json");
      if (fs.existsSync(legacyUser) && legacyUser !== USER_MEMORY_FILE) {
        const oldData = loadJsonFile(legacyUser);
        if (oldData) saveJsonFile(USER_MEMORY_FILE, oldData);
      }

      const legacyReminders = path.resolve(BACKEND_ROOT, "reminders.json");
      if (fs.existsSync(legacyReminders) && legacyReminders !== REMINDERS_FILE) {
        const oldData = loadJsonFile(legacyReminders);
        if (oldData) saveJsonFile(REMINDERS_FILE, oldData);
      }
    } catch (err) {
      logger.warn(`Legacy memory migration skipped or failed: ${err.message}`);
    }
  }

  // ==========================================
  // CORE MEMORY (Lucy Persona & Owner-managed)
  // ==========================================
  getCoreMemory() {
    this.initialize();
    return loadJsonFile(CORE_MEMORY_FILE, {
      identity: {},
      personality: {},
      facts: [],
      rules: [],
    });
  }

  updateCoreMemory(newCoreData) {
    this.initialize();
    const current = this.getCoreMemory();
    const updated = {
      ...current,
      ...newCoreData,
      identity: { ...current.identity, ...(newCoreData.identity || {}) },
      personality: { ...current.personality, ...(newCoreData.personality || {}) },
      facts: Array.isArray(newCoreData.facts) ? newCoreData.facts : current.facts,
      rules: Array.isArray(newCoreData.rules) ? newCoreData.rules : current.rules,
    };
    saveJsonFile(CORE_MEMORY_FILE, updated);
    return updated;
  }

  addCoreFact(fact) {
    this.initialize();
    const core = this.getCoreMemory();
    const facts = Array.isArray(core.facts) ? core.facts : [];
    const normalized = fact.trim();
    if (normalized && !facts.some((f) => normalizeForCompare(f) === normalizeForCompare(normalized))) {
      facts.push(normalized);
      core.facts = facts;
      saveJsonFile(CORE_MEMORY_FILE, core);
    }
    return core;
  }

  // ==========================================
  // LONG-TERM USER MEMORY
  // ==========================================
  getUserMemory(userId) {
    this.initialize();
    const data = loadJsonFile(USER_MEMORY_FILE, { users: {} });
    const user = data.users?.[userId] || { items: [] };

    // Backwards compatibility if stored as strings
    const items = (user.items || user.facts || []).map((item, idx) => {
      if (typeof item === "string") {
        return {
          id: `mem_${idx}_${Date.now()}`,
          content: item,
          category: MEMORY_CATEGORIES.GENERAL,
          importance: 3,
          createdAt: Date.now(),
          accessCount: 1,
        };
      }
      return item;
    });

    return { items };
  }

  addUserMemoryItem(userId, content, category = null, importance = null) {
    this.initialize();
    const normalizedContent = content.trim();
    if (normalizedContent.length < 5) return null;

    const userMem = this.getUserMemory(userId);
    const existing = userMem.items;

    const compareTarget = normalizeForCompare(normalizedContent);
    const isDuplicate = existing.some((item) => normalizeForCompare(item.content) === compareTarget);

    if (isDuplicate) {
      return null;
    }

    const classification = classifyMemoryCandidate(normalizedContent);
    const finalCategory = category || classification.category;
    const finalImportance = importance || classification.importance;

    const newItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      content: normalizedContent,
      category: finalCategory,
      importance: finalImportance,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      accessCount: 1,
    };

    existing.push(newItem);

    const allData = loadJsonFile(USER_MEMORY_FILE, { users: {} });
    if (!allData.users) allData.users = {};
    allData.users[userId] = {
      items: existing,
      updatedAt: Date.now(),
    };
    saveJsonFile(USER_MEMORY_FILE, allData);

    return newItem;
  }

  deleteUserMemoryItem(userId, memoryId) {
    this.initialize();
    const userMem = this.getUserMemory(userId);
    const filtered = userMem.items.filter((item) => item.id !== memoryId && item.content !== memoryId);

    const allData = loadJsonFile(USER_MEMORY_FILE, { users: {} });
    if (!allData.users) allData.users = {};
    allData.users[userId] = {
      items: filtered,
      updatedAt: Date.now(),
    };
    saveJsonFile(USER_MEMORY_FILE, allData);
    return filtered;
  }

  // ==========================================
  // TEMPORARY MEMORY (Short-term with TTL decay)
  // ==========================================
  getTemporaryMemory(userId) {
    this.initialize();
    const filePath = getTempMemoryFilePath(userId);
    const now = Date.now();
    const rawItems = loadJsonFile(filePath, []);

    // Filter out expired temporary memories (> TTL)
    const validItems = rawItems.filter((item) => now - item.createdAt < CHAT_LIMITS.TEMP_MEMORY_TTL_MS);

    if (validItems.length !== rawItems.length) {
      saveJsonFile(filePath, validItems);
    }

    return validItems;
  }

  addTemporaryMemory(userId, content) {
    this.initialize();
    const filePath = getTempMemoryFilePath(userId);
    const validItems = this.getTemporaryMemory(userId);

    validItems.push({
      id: `tmp_${Date.now()}`,
      content: content.trim(),
      createdAt: Date.now(),
      expiresAt: Date.now() + CHAT_LIMITS.TEMP_MEMORY_TTL_MS,
    });

    if (validItems.length > CHAT_LIMITS.MAX_TEMP_MEMORY_ITEMS) {
      validItems.splice(0, validItems.length - CHAT_LIMITS.MAX_TEMP_MEMORY_ITEMS);
    }

    saveJsonFile(filePath, validItems);
    return validItems;
  }

  // ==========================================
  // PROCESS CHAT MESSAGE FOR MEMORY EXTRACTION
  // ==========================================
  processChatMessage(userId, userRole, message) {
    this.addTemporaryMemory(userId, message);

    const classification = classifyMemoryCandidate(message);
    if (classification.type !== "core") {
      return null;
    }

    if (userRole === "owner") {
      const isIdentity = /nama pencipta|creator|penciptaku|tujuanku|tujuan dibuat|alfaa|2026/i.test(message);
      if (isIdentity) {
        return this.addCoreFact(message);
      }
    }

    return this.addUserMemoryItem(userId, message, classification.category, classification.importance);
  }
}

export const memoryService = new MemoryService();
