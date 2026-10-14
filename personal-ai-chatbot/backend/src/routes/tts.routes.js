import express from "express";
import { handleTts } from "../controllers/tts.controller.js";

const router = express.Router();

router.get("/", handleTts);
router.post("/", handleTts);

export default router;
