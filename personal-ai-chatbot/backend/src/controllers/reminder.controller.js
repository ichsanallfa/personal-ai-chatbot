import { reminderService } from "../services/reminder/reminderService.js";
import { parseReminderTime, extractReminderDetails } from "../services/reminder/reminderParser.js";
import { reminderDispatcher } from "../services/reminder/reminderDispatcher.js";
import { ValidationError } from "../utils/appError.js";
import { ROLES } from "../config/constants.js";

export const getReminders = async (req, res, next) => {
  try {
    const isOwner = req.user?.role === ROLES.OWNER;
    const allReminders = reminderService.loadReminders();
    const result = isOwner
      ? allReminders
      : allReminders.filter((r) => r.userId === req.user?.userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createReminder = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const platform = req.user?.platform || "web";
    const platformUserId = req.user?.platformUserId || userId;
    const { message, scheduledAt, naturalText } = req.body;

    let finalScheduledAt = scheduledAt;
    let finalMessage = message;

    if (naturalText) {
      const parsed = extractReminderDetails(naturalText);
      if (!parsed.isReminderRequest || !parsed.timeText) {
        throw new ValidationError("Could not extract a valid time from reminder text");
      }
      const parsedTime = parseReminderTime(parsed.timeText);
      if (!parsedTime) {
        throw new ValidationError(`Invalid time format: ${parsed.timeText}`);
      }
      finalScheduledAt = parsedTime;
      finalMessage = parsed.reminderMessage || "Reminder dari Lucy";
    }

    if (!finalScheduledAt) {
      throw new ValidationError("scheduledAt or valid naturalText is required");
    }

    const created = reminderService.createReminder({
      userId,
      platform,
      platformUserId,
      message: finalMessage || "Reminder dari Lucy",
      scheduledAt: finalScheduledAt,
    });

    res.status(201).json({
      success: true,
      data: created,
      message: "Reminder created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isOwner = req.user?.role === ROLES.OWNER;
    const updated = reminderService.deleteReminder(id, req.user?.userId, isOwner);
    res.json({
      success: true,
      data: updated,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const clearAllReminders = async (req, res, next) => {
  try {
    reminderService.clearAllReminders();
    res.json({
      success: true,
      message: "All reminders cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getInAppNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const notifications = reminderDispatcher.getInAppNotifications(userId);
    reminderDispatcher.clearInAppNotifications(userId);
    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};
