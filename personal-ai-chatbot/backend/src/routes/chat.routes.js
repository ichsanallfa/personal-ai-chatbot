import express from "express";
import { handleChat, getHistory, clearHistory } from "../controllers/chat.controller.js";
import { authenticate, requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { chatRateLimiter } from "../middlewares/rateLimiter.middleware.js";
import { CHAT_LIMITS } from "../config/constants.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  chatRateLimiter,
  validate({
    body: {
      message: {
        required: true,
        type: "string",
        minLength: 1,
        maxLength: CHAT_LIMITS.MAX_MESSAGE_LENGTH,
      },
    },
  }),
  handleChat
);

router.get("/history", requireAuth, getHistory);
router.delete("/history", requireAuth, clearHistory);

export default router;
