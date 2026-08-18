import test from "node:test";
import assert from "node:assert/strict";
import { parseReminderTime, extractReminderDetails } from "../src/services/reminder/reminderParser.js";
import { reminderService } from "../src/services/reminder/reminderService.js";

test("Reminder Parser: Relative time in minutes", () => {
  const baseTime = new Date("2026-08-18T10:00:00Z");
  const parsed = parseReminderTime("15 menit", baseTime);
  assert.equal(parsed.toISOString(), new Date("2026-08-18T10:15:00Z").toISOString());
});

test("Reminder Parser: Absolute 24h clock time", () => {
  const baseTime = new Date("2026-08-18T10:00:00");
  const parsed = parseReminderTime("14:30", baseTime);
  assert.equal(parsed.getHours(), 14);
  assert.equal(parsed.getMinutes(), 30);
});

test("Reminder Parser: Natural language extraction", () => {
  const extracted = extractReminderDetails("Tolong ingatkan saya 10 menit lagi untuk minum obat flu");
  assert.equal(extracted.isReminderRequest, true);
  assert.ok(extracted.timeText.includes("10 menit"));
  assert.ok(extracted.reminderMessage.toLowerCase().includes("obat"));
});

test("Reminder Service: Create and check due reminders", () => {
  const pastTime = new Date(Date.now() - 5000);
  const created = reminderService.createReminder({
    userId: "test_rem_user",
    message: "Test immediate reminder",
    scheduledAt: pastTime,
  });

  assert.ok(created.id);
  const due = reminderService.getDueReminders(new Date());
  assert.ok(due.some((r) => r.id === created.id));

  // Clean up
  reminderService.deleteReminder(created.id, "test_rem_user", true);
});
