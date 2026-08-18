import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root backend directory (src/config -> backend)
export const BACKEND_ROOT = path.resolve(__dirname, "../../");
export const PROJECT_ROOT = path.resolve(BACKEND_ROOT, "../");

// Data directory
export const DATA_DIR = path.resolve(BACKEND_ROOT, "data");
export const TEMP_MEMORY_DIR = path.resolve(DATA_DIR, "temp_memory");

// Canonical storage file paths (always absolute, independent of execution CWD)
export const CORE_MEMORY_FILE = path.resolve(DATA_DIR, "coreMemory.json");
export const SESSION_MEMORY_FILE = path.resolve(DATA_DIR, "sessionMemory.json");
export const USER_MEMORY_FILE = path.resolve(DATA_DIR, "userMemory.json");
export const REMINDERS_FILE = path.resolve(DATA_DIR, "reminders.json");
export const IDENTITIES_FILE = path.resolve(DATA_DIR, "identities.json");
export const VTS_TOKEN_FILE = path.resolve(BACKEND_ROOT, "vts-auth-token.txt");

// Helper to ensure data directory exists
export const ensureDataDirectories = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_MEMORY_DIR)) {
    fs.mkdirSync(TEMP_MEMORY_DIR, { recursive: true });
  }
};

export const getTempMemoryFilePath = (userId) => {
  ensureDataDirectories();
  const safeId = userId
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 100);
  return path.resolve(TEMP_MEMORY_DIR, `temporaryMemory_${safeId}.json`);
};
