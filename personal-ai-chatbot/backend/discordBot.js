import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import axios from "axios";
import dotenv from "dotenv";
import { isAllowedUser, isOwnerUser } from "./discordAccess.js";
import { reminderService } from "./src/services/reminder/reminderService.js";
import { extractReminderDetails, parseReminderTime } from "./src/services/reminder/reminderParser.js";

dotenv.config();

let botEnabled = true;

const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}/api/chat`;
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || "lucy_service_internal_key_secret";
const REMINDER_EXAMPLES = '"ingatkan saya jam 22:00 belajar" atau "remind 20:30 makan"';

const sendBotReply = async (message, text) => {
  try {
    await message.reply(text);
    return true;
  } catch (error) {
    try {
      await message.channel.send(text);
      return true;
    } catch (channelError) {
      try {
        await message.author.send(text);
        return true;
      } catch (dmError) {
        console.error("Failed to send bot reply:", dmError.message);
        return false;
      }
    }
  }
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.on("ready", () => {
  console.log(`🤖 Discord bot logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const content = message.content || "";
  const lowerContent = content.toLowerCase();

  // Owner Commands (!off / !on)
  if (lowerContent === "!off" || lowerContent === "!on") {
    if (!isOwnerUser(userId, process.env)) {
      return sendBotReply(message, "Maaf, hanya owner yang bisa menggunakan perintah ini.");
    }
    botEnabled = lowerContent === "!on";
    return sendBotReply(
      message,
      botEnabled ? "Lucy enabled. I am back online." : "Lucy disabled. I will stop responding."
    );
  }

  if (lowerContent === "!id" || lowerContent === "!whoami") {
    const isOwner = isOwnerUser(userId, process.env);
    return sendBotReply(message, `ID Discord Anda: ${userId} (${isOwner ? "Owner" : "User"})`);
  }

  // Clear Reminders (Owner Only)
  if (/bersihkan semua reminder|hapus semua reminder|clear all reminder|clear reminders/i.test(lowerContent)) {
    if (!isOwnerUser(userId, process.env)) {
      return sendBotReply(message, "Maaf, hanya owner yang bisa menghapus semua reminder.");
    }
    reminderService.clearAllReminders();
    return sendBotReply(message, "Semua reminder sudah dibersihkan! ✅");
  }

  if (!botEnabled) return;

  if (!isAllowedUser(userId, process.env, { guildOwnerId: message.guild?.ownerId })) {
    return sendBotReply(message, "Maaf, kamu belum diizinkan untuk menggunakan Lucy. Hubungi owner bot untuk akses.");
  }

  // Reminder Detection
  const reminderDetails = extractReminderDetails(content);

  if (reminderDetails.isReminderRequest && reminderDetails.needsTime) {
    return sendBotReply(message, `Saya siap membantu membuat pengingat.\nCoba kirim pesan seperti: ${REMINDER_EXAMPLES}.`);
  }

  if (reminderDetails.timeText) {
    const scheduledAt = parseReminderTime(reminderDetails.timeText);
    if (!scheduledAt) {
      return sendBotReply(message, "Saya belum mengerti format waktunya. Coba contoh: 10pm atau 22:00");
    }

    const finalReminderMessage = reminderDetails.reminderMessage || "Reminder dari Lucy";
    reminderService.createReminder({
      userId,
      platform: "discord",
      platformUserId: userId,
      message: finalReminderMessage,
      scheduledAt,
    });

    const isRelativeTime = /^\d+\s*(menit|jam|detik|hari)/i.test(reminderDetails.timeText);
    const timeResponse = isRelativeTime ? `dalam ${reminderDetails.timeText}` : `jam ${reminderDetails.timeText}`;
    return sendBotReply(message, `Siap! Aku ingetin kamu ${timeResponse} ya~ 😊\nPesan: "${finalReminderMessage}"`);
  }

  // Chat with AI Backend via Secure Service Key Gateway
  try {
    await message.channel.sendTyping();

    const response = await axios.post(
      BACKEND_URL,
      {
        message: content,
      },
      {
        headers: {
          "x-service-key": SERVICE_API_KEY,
          "x-user-id": userId,
          "x-platform": "discord",
        },
      }
    );

    const reply = response.data.data?.reply || response.data.reply || "Maaf, ada kendala respon.";
    await sendBotReply(message, reply);
  } catch (error) {
    console.error("Discord bot error calling backend:", error.response?.data || error.message);
    await sendBotReply(message, "Error communicating with Lucy AI.");
  }
});

if (process.env.DISCORD_BOT_TOKEN) {
  client.login(process.env.DISCORD_BOT_TOKEN);
} else {
  console.log("⚠️ DISCORD_BOT_TOKEN not configured in .env. Bot not started.");
}