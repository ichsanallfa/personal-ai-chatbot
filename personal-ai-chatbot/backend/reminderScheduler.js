import { reminderService } from "./src/services/reminder/reminderService.js";
import { parseReminderTime, extractReminderDetails, cleanReminderText } from "./src/services/reminder/reminderParser.js";

export const loadReminders = () => reminderService.loadReminders();
export const saveReminders = (reminders) => reminderService.saveReminders(reminders);
export const getDueReminders = (reminders, now = new Date()) => reminderService.getDueReminders(now);

export { parseReminderTime, extractReminderDetails, cleanReminderText };