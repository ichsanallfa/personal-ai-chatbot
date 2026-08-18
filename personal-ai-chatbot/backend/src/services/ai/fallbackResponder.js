import { getCurrentTimeInfo } from "../../utils/timeUtils.js";

const isTimeQuestion = (message) => {
  const lower = message.toLowerCase();
  return /jam berapa|pukul berapa|waktu sekarang|sekarang jam|jam sekarang|berapa jam|waktu wib|jam wib|hari ini tanggal|tanggal berapa|hari apa sekarang/.test(lower);
};

export const buildFallbackReply = (message, memoryFacts = []) => {
  const lower = (message || "").toLowerCase();
  const memorySnippet = memoryFacts.length
    ? `(Aku ingat: ${memoryFacts.slice(0, 3).join(", ")})`
    : "";

  if (isTimeQuestion(lower)) {
    return `Sekarang hari ${getCurrentTimeInfo()} WIB. ${memorySnippet || "Ada yang bisa kubantu lagi?"}`;
  }
  if (lower.includes("siapa") || lower.includes("nama")) {
    return `Saya Lucy, asisten AI pribadi yang dibuat oleh Alfaa. ${memorySnippet || "Aku siap membantu berbagai kebutuhanmu!"}`;
  }
  if (lower.includes("tujuan") || lower.includes("buat") || lower.includes("fungsi")) {
    return `Saya dibuat sebagai asisten AI pribadi untuk chatting, pengingat, voice assistant, dan integrasi VTube Studio.`;
  }
  if (lower.includes("terima kasih") || lower.includes("makasih") || lower.includes("thanks")) {
    return `Sama-sama! Senang bisa membantu kamu 😊`;
  }
  if (lower.includes("halo") || lower.includes("hai") || lower.includes("hey")) {
    return `Halo! Saya Lucy. Ada yang bisa kubantu hari ini?`;
  }

  return `Saya Lucy, asisten pribadi kamu. ${memorySnippet ? `${memorySnippet} ` : ""}Ada yang bisa kubantu lagi?`;
};
