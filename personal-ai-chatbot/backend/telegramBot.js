import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ALLOWED_USERS = process.env.TELEGRAM_ALLOWED_USERS?.split(",").map(id => id.trim()) || [];
const BACKEND_URL = "http://localhost:3001/chat";

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

  // Cek apakah user diizinkan
  if (TELEGRAM_ALLOWED_USERS.length > 0 && !TELEGRAM_ALLOWED_USERS.includes(userId)) {
    return bot.sendMessage(chatId, "Maaf, kamu tidak diizinkan menggunakan bot ini.");
  }

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

  if (text === "/id" || text === "/whoami") {
    return bot.sendMessage(chatId, 
      `ID Telegram: ${userId}\n` +
      `Nama: ${msg.from?.first_name || "Unknown"}\n` +
      `Username: @${msg.from?.username || "tidak ada"}\n` +
      `Status: ${TELEGRAM_ALLOWED_USERS.includes(userId) ? "diizinkan" : "belum diizinkan"}`
    );
  }

  // Kirim ke backend
  try {
    bot.sendChatAction(chatId, "typing");
    
    const response = await axios.post(BACKEND_URL, {
      message: text,
      userId: userId,
    });

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