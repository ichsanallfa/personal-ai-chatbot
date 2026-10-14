import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeTtsText } from "../src/services/voice/edgeTtsService.js";

test("TTS Sanitizer: Removes code blocks and URLs", () => {
  const input = "Lihat kode ini: ```javascript\nconsole.log(1);\n``` dan buka https://example.com";
  const cleaned = sanitizeTtsText(input);
  assert.ok(!cleaned.includes("console.log"));
  assert.ok(!cleaned.includes("https://"));
  assert.ok(cleaned.includes("tautan web"));
});

test("TTS Sanitizer: Strips markdown markers and trims text", () => {
  const input = "**Halo** *teman* [EMOTE: happy]";
  const cleaned = sanitizeTtsText(input);
  assert.equal(cleaned, "Halo teman");
});
