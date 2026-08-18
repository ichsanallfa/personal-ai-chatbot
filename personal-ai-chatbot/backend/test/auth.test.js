import test from "node:test";
import assert from "node:assert/strict";
import { authService } from "../src/services/auth/authService.js";
import { ROLES } from "../src/config/constants.js";
import { config } from "../src/config/env.js";

test("Auth & Anti-Spoofing: Unauthenticated user cannot forge owner role", () => {
  const role = authService.evaluateRole("web", "Alfaa", false);
  assert.notEqual(role, ROLES.OWNER, "Spoofed username without credentials must not be owner");
});

test("Auth: Owner authentication with correct secret key returns owner role and JWT", () => {
  const result = authService.authenticateOwner(config.ownerSecretKey);
  assert.ok(result.token, "Must return JWT token");
  assert.equal(result.user.role, ROLES.OWNER, "Role must be owner");

  const verified = authService.verifyToken(result.token);
  assert.equal(verified.role, ROLES.OWNER);
});

test("Auth: Owner authentication with wrong secret throws error", () => {
  assert.throws(() => {
    authService.authenticateOwner("wrong_password");
  });
});

test("Auth: Bot-to-Backend Service Key validates platform user ID and assigns role", () => {
  config.discordOwnerId = "999888777";
  const botAuth = authService.authenticateBotRequest(
    config.serviceApiKey,
    "discord",
    "999888777"
  );
  assert.equal(botAuth.role, ROLES.OWNER, "Verified Discord owner must be granted owner role");
});

test("Auth: Bot-to-Backend Service Key with invalid key throws error", () => {
  assert.throws(() => {
    authService.authenticateBotRequest("invalid_key", "discord", "123");
  });
});
