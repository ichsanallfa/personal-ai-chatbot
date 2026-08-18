import express from "express";
import { getVTubeStatus, triggerExpression, reconnectVTube } from "../controllers/vtube.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireOwner } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.get("/status", getVTubeStatus);
router.post(
  "/expression",
  requireAuth,
  validate({
    body: {
      expression: { required: true, type: "string", minLength: 1 },
    },
  }),
  triggerExpression
);
router.post("/reconnect", requireAuth, requireOwner, reconnectVTube);

export default router;
