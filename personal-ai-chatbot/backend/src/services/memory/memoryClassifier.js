import { MEMORY_CATEGORIES } from "../../config/constants.js";

export const normalizeForCompare = (text) => {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
};

export const classifyMemoryCandidate = (text) => {
  const normalized = (text || "").trim();
  const lower = normalized.toLowerCase();

  // 1. Ignore short messages (< 15 characters), questions, or common commands
  if (normalized.length < 15) return { type: "short", score: 0, category: MEMORY_CATEGORIES.GENERAL, importance: 1 };
  if (/\b(siapa|apa|bagaimana|kenapa|mengapa|kapan|dimana|berapa|jam berapa)\b/i.test(lower)) {
    return { type: "short", score: 0, category: MEMORY_CATEGORIES.GENERAL, importance: 1 };
  }
  if (/\b(tolong|hapus|ingatkan|remind|bisa kamu|test|tedt)\b/i.test(lower)) {
    return { type: "short", score: 0, category: MEMORY_CATEGORIES.GENERAL, importance: 1 };
  }

  // 2. Explicit category signals
  let category = MEMORY_CATEGORIES.GENERAL;
  let importance = 2;

  if (/\b(suka|senang|gemar|hobi|favorit|makanan favorit|minuman favorit|tidak suka|benci|preferensi)\b/i.test(lower)) {
    category = MEMORY_CATEGORIES.PREFERENCE;
    importance = 4;
  } else if (/\b(nama saya|nama aku|umur saya|umurku|lahir|tinggal di|asal dari|alamat|keluarga)\b/i.test(lower)) {
    category = MEMORY_CATEGORIES.PERSONAL_INFO;
    importance = 5;
  } else if (/\b(kerja|pekerjaan|kantor|proyek|project|kuliah|sekolah|tugas|deadline|jurusan)\b/i.test(lower)) {
    category = MEMORY_CATEGORIES.WORK;
    importance = 3;
  } else if (/\b(jadwal|rutinitas|setiap hari|setiap pagi|kebiasaan|bangun jam|tidur jam)\b/i.test(lower)) {
    category = MEMORY_CATEGORIES.SCHEDULE;
    importance = 3;
  }

  // 3. Explicit personal facts regex
  const explicitPersonalFact = /^(saya|aku)\s+(suka|senang|benci|tidak suka|prefer|lahir|tinggal|kerja|sekolah|kuliah|hobi|nama|adalah|punya)|(nama|saya|aku)\s+(suka|senang|benci|hobi|nama|favorit)/i;

  const strongSignals = [
    /\bsuka\b/i,
    /\bsenang\b/i,
    /\bpreferensi\b/i,
    /\bpaling\b/i,
    /\bselalu\b/i,
    /\bsetiap\b/i,
    /\bbutuh\b/i,
    /\bbelajar\b/i,
    /\bingin\b/i,
    /\bmau\b/i,
    /\btidak suka\b/i,
    /\bbenci\b/i,
    /\bhobi\b/i,
    /\bmakanan favorit\b/i,
    /\bminuman favorit\b/i,
    /\bbahasa\b/i,
    /\bjadwal\b/i,
  ];

  const score = strongSignals.filter((pattern) => pattern.test(lower)).length;
  const hasPersonalPronoun = /\b(saya|aku|diriku)\b/i.test(lower);

  const isCore = explicitPersonalFact.test(lower) || (hasPersonalPronoun && score >= 2);

  return {
    type: isCore ? "core" : "short",
    score,
    category,
    importance: isCore ? Math.max(importance, 3) : importance,
  };
};
