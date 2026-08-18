import { SESSION_MEMORY_FILE } from "../../config/paths.js";
import { CHAT_LIMITS } from "../../config/constants.js";
import { loadJsonFile, saveJsonFile } from "../../storage/jsonStorage.js";

class ChatHistoryService {
  constructor() {
    this.inMemoryHistories = new Map();
    this.isLoaded = false;
  }

  load() {
    if (this.isLoaded) return;
    const sessionData = loadJsonFile(SESSION_MEMORY_FILE, { users: {} });
    const users = sessionData?.users || {};
    for (const [userId, userData] of Object.entries(users)) {
      if (userData && Array.isArray(userData.conversations)) {
        this.inMemoryHistories.set(userId, userData.conversations.slice(-CHAT_LIMITS.MAX_HISTORY_TURNS));
      }
    }
    this.isLoaded = true;
  }

  getHistory(userId) {
    this.load();
    return this.inMemoryHistories.get(userId) || [];
  }

  appendTurn(userId, userMessage, assistantMessage) {
    this.load();
    const current = this.getHistory(userId);
    const updated = [
      ...current,
      { role: "user", content: userMessage, timestamp: Date.now() },
      { role: "assistant", content: assistantMessage, timestamp: Date.now() },
    ].slice(-CHAT_LIMITS.MAX_HISTORY_TURNS);

    this.inMemoryHistories.set(userId, updated);

    // Save to persistent session file
    const sessionData = loadJsonFile(SESSION_MEMORY_FILE, { users: {} });
    if (!sessionData.users) sessionData.users = {};
    sessionData.users[userId] = {
      conversations: updated,
      lastUpdated: Date.now(),
    };
    saveJsonFile(SESSION_MEMORY_FILE, sessionData);

    return updated;
  }

  clearHistory(userId) {
    this.load();
    this.inMemoryHistories.delete(userId);
    const sessionData = loadJsonFile(SESSION_MEMORY_FILE, { users: {} });
    if (sessionData.users && sessionData.users[userId]) {
      delete sessionData.users[userId];
      saveJsonFile(SESSION_MEMORY_FILE, sessionData);
    }
  }
}

export const chatHistoryService = new ChatHistoryService();
