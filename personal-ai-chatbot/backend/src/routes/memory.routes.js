import express from "express";
import {
  getCoreMemory,
  updateCoreMemory,
  getUserMemory,
  addUserMemoryItem,
  deleteUserMemoryItem,
  getTemporaryMemory,
} from "../controllers/memory.controller.js";
import { authenticate, requireAuth } from "../middlewares/auth.middleware.js";
import { requireOwner } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const router = express.Router();

// Core memory (Lucy identity & rules)
router.get("/core", getCoreMemory);
router.put("/core", requireAuth, requireOwner, updateCoreMemory);

// User long-term memory
router.get("/user", requireAuth, getUserMemory);
router.post(
  "/user",
  requireAuth,
  validate({
    body: {
      content: { required: true, type: "string", minLength: 5 },
    },
  }),
  addUserMemoryItem
);
router.delete("/user/:memoryId", requireAuth, deleteUserMemoryItem);

// User temporary memory
router.get("/temporary", requireAuth, getTemporaryMemory);

export default router;
