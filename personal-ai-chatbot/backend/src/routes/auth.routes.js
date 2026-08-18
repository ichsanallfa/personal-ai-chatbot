import express from "express";
import { loginOwner, getWebSession, linkIdentity, getCurrentUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { authenticate, requireAuth } from "../middlewares/auth.middleware.js";
import { authRateLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post(
  "/login/owner",
  authRateLimiter,
  validate({
    body: {
      secretKey: { required: true, type: "string", minLength: 4 },
    },
  }),
  loginOwner
);

router.post("/session", authRateLimiter, getWebSession);

router.post(
  "/link",
  requireAuth,
  validate({
    body: {
      platform: { required: true, enum: ["discord", "telegram", "web"] },
      platformUserId: { required: true, type: "string", minLength: 1 },
    },
  }),
  linkIdentity
);

router.get("/me", authenticate, getCurrentUser);

export default router;
