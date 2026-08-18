import express from "express";
import {
  getReminders,
  createReminder,
  deleteReminder,
  clearAllReminders,
  getInAppNotifications,
} from "../controllers/reminder.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/", requireAuth, getReminders);
router.post("/", requireAuth, createReminder);
router.delete("/all", requireAuth, requireOwner, clearAllReminders);
router.delete("/:id", requireAuth, deleteReminder);
router.get("/notifications", requireAuth, getInAppNotifications);

export default router;
