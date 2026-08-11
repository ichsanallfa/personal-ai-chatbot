import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReminderTime, getDueReminders, extractReminderDetails } from '../reminderScheduler.js';

test('parseReminderTime converts a simple clock time into a future date', () => {
  const now = new Date('2026-08-10T09:00:00.000Z');
  const reminderDate = parseReminderTime('10pm', now);

  assert.ok(reminderDate instanceof Date);
  assert.equal(reminderDate.getHours(), 22);
});

test('getDueReminders returns reminders that are due', () => {
  const now = new Date('2026-08-10T22:00:00.000Z');
  const reminders = [
    { id: 1, scheduledAt: '2026-08-10T21:59:00.000Z', message: 'test' },
    { id: 2, scheduledAt: '2026-08-10T22:00:00.000Z', message: 'now' },
  ];

  const due = getDueReminders(reminders, now);
  assert.equal(due.length, 2);
});

test('extracts a clean reminder message from natural-language input', () => {
  const { timeText, reminderMessage } = extractReminderDetails('bisakah kamu reminder saya di jam 22.00wib?');

  assert.equal(timeText, '22.00');
  assert.equal(reminderMessage, 'Reminder dari Lucy');
});

test('marks reminder-like requests without a clear time as needing clarification', () => {
  const { timeText, reminderMessage, isReminderRequest, needsTime } = extractReminderDetails('bisa kamu saya ad tugas di jam ?');

  assert.equal(timeText, null);
  assert.equal(isReminderRequest, true);
  assert.equal(needsTime, true);
  assert.equal(reminderMessage, 'tugas');
});

test('detects explicit reminder phrases with a clear time', () => {
  const { timeText, reminderMessage, isReminderRequest, needsTime } = extractReminderDetails('remind 20:30 makan');

  assert.equal(timeText, '20:30');
  assert.equal(reminderMessage, 'makan');
  assert.equal(isReminderRequest, true);
  assert.equal(needsTime, false);
});

test('does not treat ordinary memory phrases as reminders', () => {
  const { isReminderRequest, needsTime } = extractReminderDetails('saya ingat kamu');

  assert.equal(isReminderRequest, false);
  assert.equal(needsTime, false);
});

test('does not treat definition questions about reminder as reminder requests', () => {
  const { isReminderRequest, needsTime } = extractReminderDetails('bisa beritahu saya apa itu reminder');

  assert.equal(isReminderRequest, false);
  assert.equal(needsTime, false);
});

test('does not treat time questions as reminder requests', () => {
  const { isReminderRequest, needsTime } = extractReminderDetails('bisa beri tahu saya jam berapa sekarang versi waktu wib');

  assert.equal(isReminderRequest, false);
  assert.equal(needsTime, false);
});

test('does not treat schedule questions as reminder requests', () => {
  const { isReminderRequest, needsTime } = extractReminderDetails('apa jadwal saya hari ini?');

  assert.equal(isReminderRequest, false);
  assert.equal(needsTime, false);
});

test('still detects explicit reminder commands with time', () => {
  const { timeText, reminderMessage, isReminderRequest, needsTime } = extractReminderDetails('ingatkan saya jam 22:00 belajar');

  assert.equal(timeText, '22:00');
  assert.equal(reminderMessage, 'belajar');
  assert.equal(isReminderRequest, true);
  assert.equal(needsTime, false);
});

test('detects relative time reminders like "5 menit"', () => {
  const { timeText, reminderMessage, isReminderRequest, needsTime } = extractReminderDetails('ingatkan saya nanti 5 menit kedepan bahwa saya ada tugas');

  assert.equal(timeText, '5 menit kedepan');
  assert.equal(reminderMessage, 'tugas');
  assert.equal(isReminderRequest, true);
  assert.equal(needsTime, false);
});

test('parseReminderTime handles relative time correctly', () => {
  const now = new Date('2026-08-11T12:00:00.000Z');
  const reminderDate = parseReminderTime('5 menit', now);

  assert.ok(reminderDate instanceof Date);
  assert.equal(reminderDate.getTime(), now.getTime() + 5 * 60 * 1000);
});
