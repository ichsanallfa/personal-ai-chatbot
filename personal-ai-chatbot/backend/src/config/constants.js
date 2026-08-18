export const ROLES = {
  OWNER: "owner",
  ALLOWED: "allowed",
  USER: "user",
  PUBLIC: "public",
};

export const MEMORY_CATEGORIES = {
  PREFERENCE: "preference",
  PERSONAL_INFO: "personal_info",
  WORK: "work",
  SCHEDULE: "schedule",
  GENERAL: "general",
};

export const CHAT_LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_HISTORY_TURNS: 10,
  TEMP_MEMORY_TTL_MS: 2 * 60 * 60 * 1000, // 2 hours
  MAX_TEMP_MEMORY_ITEMS: 10,
};

export const EMOTION_EXPRESSIONS = {
  senang: "EyesLove.exp3.json",
  kesal: "SignAngry.exp3.json",
  sedih: "EyesCry.exp3.json",
  lucu: "SignShock.exp3.json",
  terima_kasih: "EyesLove.exp3.json",
  maaf: "EyesCry.exp3.json",
  netral: "",
};
