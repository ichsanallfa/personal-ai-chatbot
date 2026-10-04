import test from "node:test";
import assert from "node:assert/strict";
import os from "os";
import path from "path";
import fs from "fs";

const dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "lucy-db-"));
process.env.RUNTIME_DIR = dbDir;

const { readDocument, writeDocument, closeDatabase } = await import("../src/storage/sqliteStorage.js");

test("SQLite storage writes and reads documents", () => {
  writeDocument("test/document", { value: 42 });
  assert.deepEqual(readDocument("test/document", null), { value: 42 });
});

test("SQLite transaction keeps concurrent document writes valid", async () => {
  await Promise.all(Array.from({ length: 50 }, (_, index) =>
    Promise.resolve().then(() => writeDocument("test/concurrent", { index }))
  ));
  const result = readDocument("test/concurrent", null);
  assert.equal(typeof result.index, "number");
});

test.after(() => closeDatabase());
