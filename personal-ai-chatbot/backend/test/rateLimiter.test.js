import test from "node:test";
import assert from "node:assert/strict";
import { chatRateLimiter } from "../src/middlewares/rateLimiter.middleware.js";

test("Rate limiter blocks requests after configured quota", () => {
  const req = { ip: `test-${Date.now()}`, user: null };
  const headers = {};
  const res = { setHeader(name, value) { headers[name] = value; } };
  let calls = 0;
  const next = (error) => { if (!error) calls += 1; return error; };

  for (let index = 0; index < 30; index += 1) chatRateLimiter(req, res, next);
  const error = chatRateLimiter(req, res, next);

  assert.equal(calls, 30);
  assert.equal(error?.statusCode, 429);
  assert.ok(headers["Retry-After"]);
});
