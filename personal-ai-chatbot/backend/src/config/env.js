import dotenv from "dotenv";
import path from "path";
import { BACKEND_ROOT } from "./paths.js";

// Load .env relative to backend root
dotenv.config({ path: path.resolve(BACKEND_ROOT, ".env") });

const parseList = (str = "") => {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

export const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL || "*",

  // Security & Authentication
  jwtSecret: process.env.JWT_SECRET || "lucy_default_jwt_secret_please_change_in_production_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  serviceApiKey: process.env.SERVICE_API_KEY || "lucy_service_internal_key_secret",
  ownerSecretKey: process.env.OWNER_SECRET_KEY || "lucy_owner_access_pass_2026",

  // Owner & Access Lists
  discordOwnerId: process.env.DISCORD_OWNER_ID?.trim() || "",
  telegramOwnerId: process.env.TELEGRAM_OWNER_ID?.trim() || "",
  ownerUserIds: parseList(process.env.OWNER_USER_IDS),
  discordAllowedUsers: parseList(process.env.DISCORD_ALLOWED_USERS),
  telegramAllowedUsers: parseList(process.env.TELEGRAM_ALLOWED_USERS),
  allowedUserIds: parseList(process.env.ALLOWED_USER_IDS),

  // AI Configuration
  aiProvider: process.env.AI_PROVIDER || "openrouter", // openrouter | gemini | openai | mock
  aiModel: process.env.AI_MODEL || "deepseek/deepseek-chat",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterUrl: process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  // Bot Tokens
  discordBotToken: process.env.DISCORD_BOT_TOKEN || "",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",

  // VTube Studio
  vtubeWsUrl: process.env.VTUBE_WS_URL || "ws://127.0.0.1:8001",
  vtubePluginName: process.env.VTUBE_PLUGIN_NAME || "Lucy AI",
  vtubePluginDeveloper: process.env.VTUBE_PLUGIN_DEVELOPER || "Alfaa",

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
  rateLimitMaxChat: parseInt(process.env.RATE_LIMIT_MAX_CHAT, 10) || 30,
  rateLimitMaxAuth: parseInt(process.env.RATE_LIMIT_MAX_AUTH, 10) || 10,
  rateLimitMaxGeneral: parseInt(process.env.RATE_LIMIT_MAX_GENERAL, 10) || 100,
};
