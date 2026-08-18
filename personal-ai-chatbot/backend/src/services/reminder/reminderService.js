import { REMINDERS_FILE } from "../../config/paths.js";
import { loadJsonFile, saveJsonFile } from "../../storage/jsonStorage.js";
import { parseReminderTime, extractReminderDetails } from "./reminderParser.js";
import { reminderDispatcher } from "./reminderDispatcher.js";
import { logger } from "../../utils/logger.js";

class ReminderService {
  constructor() {
    this.intervalHandle = null;
  }

  loadReminders() {
    return loadJsonFile(REMINDERS_FILE, []);
  }

  saveReminders(reminders) {
    saveJsonFile(REMINDERS_FILE, reminders);
  }

  createReminder({ userId, platform = "web", platformUserId = null, message, scheduledAt }) {
    const reminders = this.loadReminders();
    const newReminder = {
      id: `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      platform,
      platformUserId: platformUserId || userId,
      message,
      scheduledAt: typeof scheduledAt === "string" ? scheduledAt : scheduledAt.toISOString(),
      createdAt: new Date().toISOString(),
    };

    reminders.push(newReminder);
    this.saveReminders(reminders);
    logger.info(`Created reminder: "${message}" for ${scheduledAt}`);
    return newReminder;
  }

  getDueReminders(now = new Date()) {
    const reminders = this.loadReminders();
    return reminders.filter((r) => new Date(r.scheduledAt) <= now);
  }

  deleteReminder(id, userId = null, isOwner = false) {
    const reminders = this.loadReminders();
    const filtered = reminders.filter((r) => {
      if (r.id !== id) return true;
      if (isOwner) return false;
      return r.userId !== userId;
    });

    this.saveReminders(filtered);
    return filtered;
  }

  clearAllReminders() {
    this.saveReminders([]);
    return [];
  }

  checkAndDispatchDueReminders() {
    const now = new Date();
    const reminders = this.loadReminders();
    const due = reminders.filter((r) => new Date(r.scheduledAt) <= now);

    if (due.length === 0) return;

    logger.info(`Found ${due.length} due reminders to dispatch.`);
    const remaining = reminders.filter((r) => !due.some((d) => d.id === r.id));
    this.saveReminders(remaining);

    for (const reminder of due) {
      reminderDispatcher.dispatch(reminder).catch((err) => {
        logger.error(`Error in reminder dispatch: ${err.message}`);
      });
    }
  }

  startScheduler(intervalMs = 15000) {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      this.checkAndDispatchDueReminders();
    }, intervalMs);
    logger.info("Standalone Reminder Scheduler started.");
  }

  stopScheduler() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}

export const reminderService = new ReminderService();
