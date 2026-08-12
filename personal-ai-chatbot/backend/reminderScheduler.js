import { loadJsonFile, saveJsonFile } from "./utils.js";

const REMINDER_FILE = "./reminders.json";

export const loadReminders = () => {
  return loadJsonFile(REMINDER_FILE, []);
};

export const saveReminders = (reminders) => {
  saveJsonFile(REMINDER_FILE, reminders);
};

export const parseReminderTime = (input, now = new Date()) => {
  const normalized = input.trim().toLowerCase().replace(/\s*(wib|utc)$/i, "");

  // Relative time: "5 menit", "5 menit lagi", "5 menit kedepan", "1 jam", "30 detik"
  const relativeMatch = normalized.match(/^(\d+)\s*(menit|jam|detik|hari)\s*(lagi|kedepan|ke depan|dari sekarang|mendatang)?$/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const reminderDate = new Date(now);

    if (unit === "menit") {
      reminderDate.setMinutes(reminderDate.getMinutes() + amount);
    } else if (unit === "jam") {
      reminderDate.setHours(reminderDate.getHours() + amount);
    } else if (unit === "detik") {
      reminderDate.setSeconds(reminderDate.getSeconds() + amount);
    } else if (unit === "hari") {
      reminderDate.setDate(reminderDate.getDate() + amount);
    }

    return reminderDate;
  }

  const match = normalized.match(/^(\d{1,2})(?:(:|\.)(\d{2}))?\s*(am|pm)?$/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[3] || "0");
  const meridiem = match[4];

  if (meridiem === "pm" && hour < 12) {
    hour += 12;
  }

  if (meridiem === "am" && hour === 12) {
    hour = 0;
  }

  if (hour > 23 || minute > 59) {
    return null;
  }

  const reminderDate = new Date(now);
  reminderDate.setHours(hour, minute, 0, 0);

  if (reminderDate <= now) {
    reminderDate.setDate(reminderDate.getDate() + 1);
  }

  return reminderDate;
};

const STOPWORDS = /\b(ingatkan|remind|ingetin|pengingat|reminder|ingat|inget|tolong|jadwal|jadwalin|nanti|bahwa|saya|aku|kamu|di|ke|ya|nih|dong|kan|lah|saja|lagi|deh|yuk|bisa|bisakah|boleh|untuk|mau|gak|nggak|sudah|ad|ada|jam|pukul|wib|utc|ok|okay|oke|oh|ohh|iy|ye|y|perlu)\b/gi;

const cleanReminderText = (text) => {
  const cleaned = text
    .replace(STOPWORDS, "")
    .replace(/[?.,!]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Reminder dari Lucy";
};

const buildReminderResult = (timeText, reminderMessage, needsTime = false) => ({
  timeText,
  reminderMessage,
  isReminderRequest: true,
  needsTime,
});

export const extractReminderDetails = (content) => {
  const normalized = content.trim();
  const explicitReminderCommand = /\b(ingatkan|remind|ingetin|pengingat|reminder|tolong ingatkan|jadwalkan|jadwalin)\b/i.test(normalized);
  const hasTimeCue = /\b(jam|pukul|wib|utc|menit|detik|hari|tanggal|besok|nanti|sore|pagi|malam|siang)\b/i.test(normalized);
  const hasTaskCue = /\b(tugas|deadline|meeting|rapat|kerja|belajar|makan|minum|telpon|call|event|habis|sekarang)\b/i.test(normalized);
  const isDefinitionQuestion = /\b(apa|bagaimana|jelaskan|definisi|arti|meaning|itu)\b/i.test(normalized) && /\b(reminder|pengingat|jadwal)\b/i.test(normalized);
  const isTimeQuestion = /\b(jam berapa|pukul berapa|waktu sekarang|sekarang jam|jam sekarang|tanggal berapa|hari apa sekarang|waktu wib)\b/i.test(normalized);
  const isQuestionWord = /\b(apa|kapan|berapa|bagaimana|mengapa|kenapa|siapa|dimana|mana)\b/i.test(normalized);
  const isScheduleQuery = isQuestionWord && /\b(jadwal|schedule|agenda|rencana)\b/i.test(normalized);
  const isBotReply = /^hey!|^saya siap membantu|^coba kirim pesan/i.test(normalized);
  const isDeleteCommand = /\b(bersihkan|hapus|clear|delete|reset|buang|remove|hilangkan|buang)\b/i.test(normalized) && /\b(reminder|pengingat|history|semua|riwayat)\b/i.test(normalized);

  // Hanya anggap reminder jika ada perintah eksplisit ATAU kombinasi waktu+tugas yang jelas
  const reminderLike = hasTimeCue && hasTaskCue;
  const isReminderRequest = !isDefinitionQuestion && !isTimeQuestion && !isScheduleQuery && !isBotReply && !isDeleteCommand && (explicitReminderCommand || reminderLike);

  if (!isReminderRequest) {
    return { timeText: null, reminderMessage: "", isReminderRequest: false, needsTime: false };
  }

  // Relative time: "5 menit", "5 menit lagi", "5 menit kedepan", "2 jam"
  const relativeTimeMatch = normalized.match(/\b(\d+)\s*(menit|jam|detik|hari)\s*(lagi|kedepan|ke depan|dari sekarang|mendatang)?/i);

  if (relativeTimeMatch) {
    const timeText = `${relativeTimeMatch[1]} ${relativeTimeMatch[2]}${relativeTimeMatch[3] ? " " + relativeTimeMatch[3] : ""}`;
    const startIndex = relativeTimeMatch.index ?? 0;
    const beforeTime = normalized.slice(0, startIndex);
    const afterTime = normalized.slice(startIndex + relativeTimeMatch[0].length);

    const cleanedBefore = cleanReminderText(beforeTime);
    const cleanedAfter = cleanReminderText(afterTime);

    const reminderMessage = (cleanedAfter || cleanedBefore || "Reminder dari Lucy").trim();

    return buildReminderResult(timeText, reminderMessage);
  }

  const timeMatch = normalized.match(/\b\d{1,2}(?::\d{2})?(?:\.\d{2})?(?:\s*(?:am|pm|wib|utc))?\b/i);

  if (!timeMatch) {
    return buildReminderResult(null, cleanReminderText(normalized), true);
  }

  const rawTimeText = timeMatch[0].trim();
  const timeText = rawTimeText.replace(/\s*(wib|utc)$/i, "");
  const hasClearTime = /^\d{1,2}(?::\d{2})?(?:\.\d{2})?(?:\s*(?:am|pm))?$/.test(timeText);

  if (!hasClearTime) {
    return buildReminderResult(null, cleanReminderText(normalized), true);
  }

  const startIndex = timeMatch.index ?? 0;
  const beforeTime = normalized.slice(0, startIndex);
  const afterTime = normalized.slice(startIndex + rawTimeText.length);

  const cleanedBefore = cleanReminderText(beforeTime);
  const cleanedAfter = cleanReminderText(afterTime);

  const reminderMessage = (cleanedAfter || cleanedBefore || "Reminder dari Lucy").trim();

  return buildReminderResult(timeText, reminderMessage);
};

export const getDueReminders = (reminders, now = new Date()) => {
  return reminders.filter((reminder) => {
    const scheduledAt = new Date(reminder.scheduledAt);
    return scheduledAt <= now;
  });
};