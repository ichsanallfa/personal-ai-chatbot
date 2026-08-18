import test from "node:test";
import assert from "node:assert/strict";
import { detectEmotion } from "../src/services/ai/emotionDetector.js";
import { aiService } from "../src/services/ai/aiService.js";
import { buildFallbackReply } from "../src/services/ai/fallbackResponder.js";
import { ROLES } from "../src/config/constants.js";

test("Emotion Detector: Happy sentiment", () => {
  const result = detectEmotion("Wah aku senang sekali hari ini, mantap!");
  assert.equal(result.emotion, "senang");
  assert.ok(result.intensity > 0.5);
});

test("Emotion Detector: Gratitude sentiment", () => {
  const result = detectEmotion("Terima kasih banyak atas bantuannya ya!");
  assert.equal(result.emotion, "terima_kasih");
  assert.ok(result.intensity > 0.5);
});

test("Emotion Detector: Angry / irritated sentiment", () => {
  const result = detectEmotion("Aduh kesal banget, error terus!");
  assert.equal(result.emotion, "kesal");
});

test("AI Service: Prompt Builder includes WIB time and owner context", () => {
  const prompt = aiService.buildSystemPrompt(
    { identity: { name: "Lucy", creator: "Alfaa" }, rules: ["Rahasia"] },
    [{ content: "Suka kopi", category: "preference" }],
    [{ content: "Sedang ngoding" }],
    { role: ROLES.OWNER }
  );

  assert.ok(prompt.includes("Lucy"));
  assert.ok(prompt.includes("Alfaa"));
  assert.ok(prompt.includes("WIB"));
  assert.ok(prompt.includes("Suka kopi"));
});

test("AI Service: Generates mock / fallback response gracefully", async () => {
  const res = await aiService.generateReply({
    userId: "test_ai_user",
    userRole: ROLES.USER,
    message: "Halo Lucy, siapa namamu?",
    preferredProvider: "mock",
  });

  assert.ok(res.reply);
  assert.equal(res.mode, "mock");
});
