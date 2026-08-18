import test from "node:test";
import assert from "node:assert/strict";
import { identityService } from "../src/services/auth/identityService.js";

test("Identity: Resolve canonical user ID for platform accounts", () => {
  const canonical1 = identityService.resolveCanonicalUserId("discord", "user_12345");
  assert.ok(canonical1.startsWith("user_discord_"));

  // Resolving again should return the same canonical ID
  const canonical2 = identityService.resolveCanonicalUserId("discord", "user_12345");
  assert.equal(canonical1, canonical2);
});

test("Identity: Link multiple platform accounts to a single canonical user", () => {
  const canonical = identityService.resolveCanonicalUserId("web", "session_abc");
  identityService.linkPlatform(canonical, "telegram", "tg_user_777");

  const identity = identityService.getUserIdentity(canonical);
  assert.equal(identity.platforms.web, "session_abc");
  assert.equal(identity.platforms.telegram, "tg_user_777");

  // Resolving linked telegram ID should point to same canonical user
  const resolved = identityService.resolveCanonicalUserId("telegram", "tg_user_777");
  assert.equal(resolved, canonical);
});
