import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { PROJECT_ROOT } from "../config/paths.js";

const runtimeDir = process.env.RUNTIME_DIR
  ? path.resolve(process.cwd(), process.env.RUNTIME_DIR)
  : path.resolve(PROJECT_ROOT, ".runtime");
fs.mkdirSync(runtimeDir, { recursive: true });

const dbPath = process.env.SQLITE_DB_PATH || path.resolve(runtimeDir, "lucy.sqlite");
export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export const readDocument = (key, defaultValue) => {
  const row = db.prepare("SELECT value FROM documents WHERE key = ?").get(key);
  if (!row) return defaultValue;
  try {
    return JSON.parse(row.value);
  } catch {
    return defaultValue;
  }
};

export const writeDocument = db.transaction((key, value) => {
  db.prepare(`
    INSERT INTO documents (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), Date.now());
  return value;
});

export const closeDatabase = () => db.close();

export const resetDatabaseForTests = () => {
  db.exec("DELETE FROM documents");
};
