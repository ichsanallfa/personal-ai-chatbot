import test from "node:test";
import assert from "node:assert/strict";
import { memoryService } from "../src/services/memory/memoryService.js";
import { classifyMemoryCandidate, normalizeForCompare } from "../src/services/memory/memoryClassifier.js";
import { MEMORY_CATEGORIES } from "../src/config/constants.js";

test("Memory Classifier: Classify personal preference and importance", () => {
  const result = classifyMemoryCandidate("Saya sangat suka makanan nasi goreng dan matcha latte");
  assert.equal(result.type, "core");
  assert.equal(result.category, MEMORY_CATEGORIES.PREFERENCE);
  assert.ok(result.importance >= 4);
});

test("Memory Classifier: Ignore generic questions and short banter", () => {
  const q1 = classifyMemoryCandidate("Jam berapa sekarang?");
  assert.equal(q1.type, "short");

  const q2 = classifyMemoryCandidate("halo");
  assert.equal(q2.type, "short");
});

test("Memory Service: Add user long-term memory and prevent duplicates", () => {
  const testUser = `test_user_${Date.now()}`;
  const item1 = memoryService.addUserMemoryItem(testUser, "Saya bekerja sebagai software engineer", MEMORY_CATEGORIES.WORK, 4);
  assert.ok(item1);
  assert.equal(item1.category, MEMORY_CATEGORIES.WORK);

  // Duplicate submission with different casing/punctuation
  const item2 = memoryService.addUserMemoryItem(testUser, " saya bekerja sebagai software engineer! ");
  assert.equal(item2, null, "Duplicate memory must be rejected");

  const mem = memoryService.getUserMemory(testUser);
  assert.equal(mem.items.length, 1);
});

test("Memory Service: Temporary memory TTL expiration", () => {
  const testUser = `test_temp_${Date.now()}`;
  memoryService.addTemporaryMemory(testUser, "Topik pembicaraan singkat A");
  memoryService.addTemporaryMemory(testUser, "Topik pembicaraan singkat B");

  const temp = memoryService.getTemporaryMemory(testUser);
  assert.equal(temp.length, 2);
  assert.ok(temp[0].expiresAt > Date.now());
});

test("Memory Service: Core memory management", () => {
  const core = memoryService.getCoreMemory();
  assert.ok(core.identity?.name);
  assert.ok(Array.isArray(core.facts));
  assert.ok(Array.isArray(core.rules));
});
