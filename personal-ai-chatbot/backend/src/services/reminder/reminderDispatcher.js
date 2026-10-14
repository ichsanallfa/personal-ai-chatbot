import axios from "axios";
import { config } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

class ReminderDispatcher {
  constructor() {
    this.inAppNotifications = new Map(); // userId -> array of notifications
  }

  getInAppNotifications(userId) {
    return this.inAppNotifications.get(userId) || [];
  }

  clearInAppNotifications(userId) {
    this.inAppNotifications.delete(userId);
  }

  async dispatch(reminder) {
    const { platform, platformUserId, message, userId } = reminder;
    const taskPrefix = /^(tugas|meeting|rapat|deadline|event|jadwal|kerja|belajar|makan|minum|telpon|call|obat)/i.test(message)
      ? "Ada "
      : "";
    const reminderText = `⏰ Hey! ${taskPrefix}${message} — Lucy 😊`;

    logger.info(`Dispatching reminder [${reminder.id}] to ${platform || "web"}:${platformUserId || userId}`);

    // 1. Dispatch to Telegram
    if (platform === "telegram" && config.telegramBotToken && platformUserId) {
      try {
        await axios.post(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          chat_id: platformUserId,
          text: reminderText,
        });
        return true;
      } catch (err) {
        logger.error(`Failed to send Telegram reminder: ${err.message}`);
      }
    }

    // 2. Dispatch to Discord
    if (platform === "discord" && platformUserId) {
      try {
        const { client } = await import("../../bots/discordBot.js");
        if (client && client.isReady && client.isReady()) {
          const user = await client.users.fetch(platformUserId);
          if (user) {
            await user.send(reminderText);
            return true;
          }
        } else if (config.discordBotToken) {
          const dmRes = await axios.post(
            "https://discord.com/api/v10/users/@me/channels",
            { recipient_id: platformUserId },
            { headers: { Authorization: `Bot ${config.discordBotToken}` } }
          );
          if (dmRes.data?.id) {
            await axios.post(
              `https://discord.com/api/v10/channels/${dmRes.data.id}/messages`,
              { content: reminderText },
              { headers: { Authorization: `Bot ${config.discordBotToken}` } }
            );
            return true;
          }
        }
      } catch (err) {
        logger.error(`Failed to send Discord reminder: ${err.message}`);
      }
    }

    // 3. Dispatch to In-App Web Notification Queue
    const targetUser = userId || platformUserId;
    if (targetUser) {
      const userNotes = this.inAppNotifications.get(targetUser) || [];
      userNotes.push({
        id: reminder.id,
        message: reminderText,
        timestamp: Date.now(),
      });
      this.inAppNotifications.set(targetUser, userNotes);
    }

    return true;
  }
}

export const reminderDispatcher = new ReminderDispatcher();
