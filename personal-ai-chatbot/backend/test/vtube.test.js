import test from "node:test";
import assert from "node:assert/strict";
import { vtubeService } from "../src/services/vtube/vtubeService.js";
import { EMOTION_EXPRESSIONS } from "../src/config/constants.js";

test("VTube Service: Emotion expressions map correctly", () => {
  assert.equal(EMOTION_EXPRESSIONS.senang, "EyesLove.exp3.json");
  assert.equal(EMOTION_EXPRESSIONS.kesal, "SignAngry.exp3.json");
  assert.equal(EMOTION_EXPRESSIONS.sedih, "EyesCry.exp3.json");
});

test("VTube Service: Initial status check", () => {
  const status = vtubeService.getStatus();
  assert.equal(typeof status.connected, "boolean");
  assert.equal(typeof status.authenticated, "boolean");
});
