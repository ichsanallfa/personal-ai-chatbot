import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import { config } from "../config/env.js";
import { reminderService } from "../services/reminder/reminderService.js";

let bot;
let botEnabled = true;
export const startTelegramBot = () => {
  if (!config.telegramBotToken) return false;
  bot = new TelegramBot(config.telegramBotToken, { polling: true });
  bot.on("message", async (message) => {
    const userId = message.from?.id?.toString();
    const text = message.text || "";
    const chatId = message.chat.id;
    const owner = userId === config.telegramOwnerId;
    if (text === "/start") return bot.sendMessage(chatId, "Halo! Saya Lucy, asisten AI pribadi.");
    if (text === "/id" || text === "/whoami") return bot.sendMessage(chatId, `ID Telegram: ${userId}\nStatus: ${owner ? "Owner" : "User"}`);
    if (text === "/on" || text === "/off") { if (!owner) return bot.sendMessage(chatId, "Hanya owner yang bisa mengubah status bot."); botEnabled = text === "/on"; return bot.sendMessage(chatId, botEnabled ? "Lucy enabled." : "Lucy disabled."); }
    if (!botEnabled) return;
    const allowed = config.telegramAllowedUsers.includes(userId) || config.allowedUserIds.includes(userId) || owner;
    if (!allowed) return bot.sendMessage(chatId, "Kamu belum diizinkan menggunakan Lucy.");
    try { const response = await axios.post(config.backendUrl, { message: text }, { headers: { "x-service-key": config.serviceApiKey, "x-user-id": userId, "x-platform": "telegram" } }); return bot.sendMessage(chatId, response.data.data?.reply || response.data.reply || "Maaf, ada kendala."); } catch (error) { console.error("Telegram bot backend error:", error.response?.data || error.message); return bot.sendMessage(chatId, "Error communicating dengan Lucy AI."); }
  });
  return true;
};
export const stopTelegramBot = async () => { if (bot) await bot.stopPolling(); };
export { bot };
