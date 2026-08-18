import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";
import { reminderService } from "./src/services/reminder/reminderService.js";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}/api/chat`;
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "lucy_service_internal_key_secret";

let botEnabled = true;

const getTelegramAllowedUsers = () => {
  return (process.env.TELEGRAM_ALLOWED_USERS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

if (!TELEGRAM_BOT_TOKEN) {
  console.log("⚠️ TELEGRAM_BOT_TOKEN not configured in .env. Bot not started.");
} else {
  const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id?.toString();
    const text = msg.text || "";

    if (text === "/start") {
      return bot.sendMessage(chatId, "Halo! Saya Lucy, asisten AI pribadi.\nKirim pesan apa saja untuk chatting.");
    }

    if (text === "/help") {
      return bot.sendMessage(
        chatId,
        "Perintah yang tersedia:\n" +
        "/start - Mulai chatting\n" +
        "/help - Bantuan\n" +
        "/id - Lihat ID Telegram kamu\n" +
        "/on - Enable bot\n" +
        "/off - Disable bot"
      );
    }

    const telegramOwnerId = process.env.TELEGRAM_OWNER_ID?.trim();
    const allowedUsers = getTelegramAllowedUsers();
    const isOwner = telegramOwnerId && userId === telegramOwnerId;

    if (text === "/on" || text === "/off") {
      if (!isOwner) {
        return bot.sendMessage(chatId, "Maaf, hanya owner yang bisa menggunakan perintah ini.");
      }
      botEnabled = text === "/on";
      return bot.sendMessage(chatId, botEnabled ? "Lucy enabled. I am back online." : "Lucy disabled. I will stop responding.");
    }

    if (text === "/id" || text === "/whoami") {
      const rawAllowed = (process.env.TELEGRAM_ALLOWED_USERS || "").trim().toLowerCase();
      const isPublicMode = !rawAllowed || rawAllowed === "*" || rawAllowed === "public";
      const statusText = isOwner ? "Owner (Pemilik)" : isPublicMode || allowedUsers.includes(userId) ? "diizinkan" : "belum diizinkan";

      return bot.sendMessage(
        chatId,
        `ID Telegram: ${userId}\n` +
        `Nama: ${msg.from?.first_name || "Unknown"}\n` +
        `Username: @${msg.from?.username || "tidak ada"}\n` +
        `Status: ${statusText}`
      );
    }

    // Clear Reminders (Owner Only)
    if (/bersihkan semua reminder|hapus semua reminder|clear all reminder/i.test(text.toLowerCase())) {
      if (!isOwner) {
        return bot.sendMessage(chatId, "Maaf, hanya owner yang bisa menghapus semua reminder.");
      }
      reminderService.clearAllReminders();
      return bot.sendMessage(chatId, "Semua reminder sudah dibersihkan! ✅");
    }

    if (!botEnabled) return;

    const rawAllowed = (process.env.TELEGRAM_ALLOWED_USERS || "").trim().toLowerCase();
    const isPublicMode = !rawAllowed || rawAllowed === "*" || rawAllowed === "public";

    if (!isPublicMode && !isOwner && !allowedUsers.includes(userId)) {
      return bot.sendMessage(chatId, "Maaf, kamu belum diizinkan untuk menggunakan Lucy. Hubungi owner bot untuk akses.");
    }

    // Send to Backend API with secure Service Key
    try {
      bot.sendChatAction(chatId, "typing");

      const response = await axios.post(
        BACKEND_URL,
        {
          message: text,
        },
        {
          headers: {
            "x-service-key": SERVICE_API_KEY,
            "x-user-id": userId,
            "x-platform": "telegram",
          },
        }
      );

      const reply = response.data.data?.reply || response.data.reply || "Maaf, ada kendala.";
      await bot.sendMessage(chatId, reply);
    } catch (error) {
      console.error("Telegram bot error calling backend:", error.response?.data || error.message);
      await bot.sendMessage(chatId, "Error talking to Lucy AI.");
    }
  });

  bot.on("polling_error", (error) => {
    console.error("Telegram polling error:", error.message);
  });

  console.log("🤖 Telegram bot started...");
}