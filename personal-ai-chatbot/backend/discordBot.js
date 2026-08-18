import {
  Client,
  GatewayIntentBits,
  Partials,
} from "discord.js";

import axios from "axios";
import dotenv from "dotenv";
import { extractReminderDetails, getDueReminders, loadReminders, parseReminderTime, saveReminders } from "./reminderScheduler.js";
import { isAllowedUser, isOwnerUser } from "./discordAccess.js";

dotenv.config();

let botEnabled = true;

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
  console.log(`Logged in as ${client.user.tag}`);
  setInterval(() => {
    const reminders = loadReminders();
    const dueReminders = getDueReminders(reminders, new Date());

    if (dueReminders.length === 0) {
      return;
    }

    const remainingReminders = reminders.filter((reminder) => !dueReminders.some((item) => item.id === reminder.id));
    saveReminders(remainingReminders);

    dueReminders.forEach((reminder) => {
      const message = reminder.message;
      const taskPrefix = /^(tugas|meeting|rapat|deadline|event|jadwal|kerja|belajar|makan|minum|telpon|call|obat)/i.test(message) ? "Ada " : "";
      const reminderMessage = `Hey! ${taskPrefix}${message} — Lucy 😊`;
      client.users.fetch(reminder.userId).then((user) => user.send(reminderMessage)).catch(() => {});
    });
  }, 30000);
});

client.on("messageCreate", async (message) => {
  console.log("Message received from", message.author.id, ":", message.content);

  if (message.author.bot) return;

  const userId = message.author.id;
  const content = message.content || "";
  const lowerContent = content.toLowerCase();

  // Perintah !off/!on HANYA untuk owner
  if (lowerContent === "!off" || lowerContent === "!on") {
    if (!isOwnerUser(userId, process.env)) {
      return sendBotReply(message, "Maaf, hanya owner yang bisa menggunakan perintah ini.");
    }

    botEnabled = (lowerContent === "!on");
    return sendBotReply(
      message,
      botEnabled ? "Lucy enabled. I am back online." : "Lucy disabled. I will stop responding."
    );
  }

  if (lowerContent === "!id" || lowerContent === "!whoami") {
    return sendBotReply(message, `ID Discord Anda: ${userId}`);
  }

  // Perintah bersihkan semua reminder HANYA untuk owner
  if (/bersihkan semua reminder|hapus semua reminder|clear all reminder|clear reminders|hapus reminder semua|remove semua.*reminder|remove.*history.*reminder|hapus.*history.*reminder|bersihkan.*history.*reminder/i.test(lowerContent)) {
    if (!isOwnerUser(userId, process.env)) {
      return sendBotReply(message, "Maaf, hanya owner yang bisa menghapus semua reminder.");
    }

    saveReminders([]);
    return sendBotReply(message, "Semua reminder sudah dibersihkan! ✅");
  }

  if (!botEnabled) return;

  // Access control: hanya user yang diizinkan yang bisa chat
  if (!isAllowedUser(userId, process.env, { guildOwnerId: message.guild?.ownerId })) {
    return sendBotReply(message, "Maaf, kamu belum diizinkan untuk menggunakan Lucy. Hubungi owner bot untuk akses.");
  }

  const reminderDetails = extractReminderDetails(content);

  if (reminderDetails.isReminderRequest && reminderDetails.needsTime) {
    return sendBotReply(message, `Saya siap membantu membuat pengingat.\nCoba kirim pesan seperti: ${REMINDER_EXAMPLES}.`);
  }

  if (reminderDetails.timeText) {
    const scheduledAt = parseReminderTime(reminderDetails.timeText);

    if (!scheduledAt) {
      return sendBotReply(message, "Saya belum mengerti format waktunya. Coba contoh: 10pm atau 22:00");
    }

    const reminders = loadReminders();
    const finalReminderMessage = reminderDetails.reminderMessage || "Reminder dari Lucy";

    reminders.push({
      id: Date.now(),
      userId: message.author.id,
      scheduledAt: scheduledAt.toISOString(),
      message: finalReminderMessage,
    });
    saveReminders(reminders);

    const isRelativeTime = /^\d+\s*(menit|jam|detik|hari)/i.test(reminderDetails.timeText);
    const timeResponse = isRelativeTime
      ? `dalam ${reminderDetails.timeText}`
      : `jam ${reminderDetails.timeText}`;
    return sendBotReply(message, `Siap! Aku ingetin kamu ${timeResponse} ya~ 😊\nPesan: "${finalReminderMessage}"`);
  }

  try {
    await message.channel.sendTyping();

    const response = await axios.post(
      "http://localhost:3001/chat",
      {
        message: content,
      },
      {
        headers: {
          "x-user-id": message.author.id,
        },
      }
    );

    await sendBotReply(message, response.data.reply);
  } catch (error) {
    console.error(error.response?.data || error.message);
    await sendBotReply(message, "Error talking to AI.");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);