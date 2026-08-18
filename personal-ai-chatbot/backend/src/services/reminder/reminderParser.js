export const parseReminderTime = (input, now = new Date()) => {
  if (!input) return null;
  const normalized = input.trim().toLowerCase().replace(/\s*(wib|utc)$/i, "");

  // Relative time: "5 menit", "5 menit lagi", "1 jam", "30 detik", "2 hari"
  const relativeMatch = normalized.match(/^(\d+)\s*(menit|jam|detik|hari)\s*(lagi|kedepan|ke depan|dari sekarang|mendatang)?$/i);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
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

  // Absolute time: "22:00", "22.30", "10pm", "8am"
  const match = normalized.match(/^(\d{1,2})(?:(:|\.)(\d{2}))?\s*(am|pm)?$/i);
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[3] || "0");
  const meridiem = match[4]?.toLowerCase();

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

const STOPWORDS = /\b(ingatkan|remind|ingetin|pengingat|reminder|ingat|inget|tolong|jadwal|jadwalin|nanti|bahwa|saya|aku|kamu|di|ke|ya|nih|dong|kan|lah|saja|lagi|deh|yuk|bisa|bisakah|boleh|untuk|mau|gak|nggak|sudah|ad|ada|jam|pukul|wib|utc|ok|okay|oke)\b/gi;

export const cleanReminderText = (text) => {
  const cleaned = (text || "")
    .replace(STOPWORDS, "")
    .replace(/[?.,!]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Reminder dari Lucy";
};

export const extractReminderDetails = (content = "") => {
  const normalized = content.trim();
  const explicitReminderCommand = /\b(ingatkan|remind|ingetin|pengingat|reminder|tolong ingatkan|jadwalkan|jadwalin)\b/i.test(normalized);
  const hasTimeCue = /\b(jam|pukul|wib|utc|menit|detik|hari|tanggal|besok|nanti|sore|pagi|malam|siang)\b/i.test(normalized);
  const hasTaskCue = /\b(tugas|deadline|meeting|rapat|kerja|belajar|makan|minum|telpon|call|event|habis|sekarang|obat)\b/i.test(normalized);
  const isQuestion = /\b(apa|kapan|bagaimana|siapa|kenapa)\b/i.test(normalized);

  const isReminderRequest = (explicitReminderCommand || (hasTimeCue && hasTaskCue)) && !isQuestion;

  if (!isReminderRequest) {
    return { timeText: null, reminderMessage: "", isReminderRequest: false, needsTime: false };
  }

  // 1. Check relative time pattern
  const relativeMatch = normalized.match(/\b(\d+)\s*(menit|jam|detik|hari)\s*(lagi|kedepan|ke depan|dari sekarang|mendatang)?/i);
  if (relativeMatch) {
    const timeText = relativeMatch[0].trim();
    const before = normalized.slice(0, relativeMatch.index);
    const after = normalized.slice(relativeMatch.index + timeText.length);
    const reminderMessage = cleanReminderText(after) || cleanReminderText(before) || "Reminder dari Lucy";
    return { timeText, reminderMessage, isReminderRequest: true, needsTime: false };
  }

  // 2. Check clock time pattern
  const timeMatch = normalized.match(/\b\d{1,2}(?::\d{2})?(?:\.\d{2})?(?:\s*(?:am|pm|wib|utc))?\b/i);
  if (!timeMatch) {
    return { timeText: null, reminderMessage: cleanReminderText(normalized), isReminderRequest: true, needsTime: true };
  }

  const rawTimeText = timeMatch[0].trim();
  const timeText = rawTimeText.replace(/\s*(wib|utc)$/i, "");
  const before = normalized.slice(0, timeMatch.index);
  const after = normalized.slice(timeMatch.index + rawTimeText.length);
  const reminderMessage = cleanReminderText(after) || cleanReminderText(before) || "Reminder dari Lucy";

  return { timeText, reminderMessage, isReminderRequest: true, needsTime: false };
};
