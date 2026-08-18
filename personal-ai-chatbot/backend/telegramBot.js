import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";
import { saveReminders } from "./reminderScheduler.js";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const getTelegramAllowedUsers = () => {
  return (process.env.TELEGRAM_ALLOWED_USERS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

const BACKEND_URL = "http://localhost:3001/chat";

let botEnabled = true;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN tidak ditemukan di .env");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id?.toString();
  const text = msg.text || "";

  console.log(`Telegram message from ${userId}: ${text}`);

  // Perintah khusus
  if (text === "/start") {
    return bot.sendMessage(chatId, "Halo! Saya Lucy, asisten AI pribadi.\nKirim pesan apa saja untuk chatting.");
  }

  if (text === "/help") {
    return bot.sendMessage(chatId, 
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

  // Perintah /on dan /off HANYA untuk owner
  if (text === "/on" || text === "/off") {
    if (!isOwner) {
      return bot.sendMessage(chatId, "Maaf, hanya owner yang bisa menggunakan perintah ini.");
    }
    botEnabled = (text === "/on");
    return bot.sendMessage(chatId, botEnabled ? "Lucy enabled. I am back online." : "Lucy disabled. I will stop responding.");
  }

  if (text === "/id" || text === "/whoami") {
    const rawAllowed = (process.env.TELEGRAM_ALLOWED_USERS || "").trim().toLowerCase();
    const isPublicMode = !rawAllowed || rawAllowed === "*" || rawAllowed === "public";
    const statusText = isOwner ? "Owner (Pemilik)" : (isPublicMode || allowedUsers.includes(userId) ? "diizinkan" : "belum diizinkan");

    return bot.sendMessage(chatId, 
      `ID Telegram: ${userId}\n` +
      `Nama: ${msg.from?.first_name || "Unknown"}\n` +
      `Username: @${msg.from?.username || "tidak ada"}\n` +
      `Status: ${statusText}`
    );
  }

  // Perintah bersihkan semua reminder HANYA untuk owner
  if (/bersihkan semua reminder|hapus semua reminder|clear all reminder|clear reminders|hapus reminder semua|remove semua.*reminder|remove.*history.*reminder|hapus.*history.*reminder|bersihkan.*history.*reminder/i.test(text.toLowerCase())) {
    if (!isOwner) {
      return bot.sendMessage(chatId, "Maaf, hanya owner yang bisa menghapus semua reminder.");
    }
    saveReminders([]);
    return bot.sendMessage(chatId, "Semua reminder sudah dibersihkan! ✅");
  }

  if (!botEnabled) return;

  // Access control: jika TELEGRAM_ALLOWED_USERS diisi khusus, batasi akses. Jika kosong, "*", atau "public", mode publik.
  const rawAllowed = (process.env.TELEGRAM_ALLOWED_USERS || "").trim().toLowerCase();
  const isPublicMode = !rawAllowed || rawAllowed === "*" || rawAllowed === "public";

  if (!isPublicMode && !isOwner && !allowedUsers.includes(userId)) {
    return bot.sendMessage(chatId, "Maaf, kamu belum diizinkan untuk menggunakan Lucy. Hubungi owner bot untuk akses.");
  }

  // Kirim ke backend
  try {
    bot.sendChatAction(chatId, "typing");
    
    const response = await axios.post(
      BACKEND_URL,
      {
        message: text,
      },
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );

    const reply = response.data.reply;
    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    await bot.sendMessage(chatId, "Error talking to AI.");
  }
});

bot.on("polling_error", (error) => {
  console.error("Telegram polling error:", error.message);
});

console.log("Telegram bot started...");