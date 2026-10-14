import { spawn } from "child_process";
import { Readable, PassThrough } from "stream";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { PROJECT_ROOT } from "../../config/paths.js";
import { logger } from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STREAMER_SCRIPT = path.resolve(__dirname, "streamer.py");

// In-memory audio cache for repeated phrases (0ms playback)
const ttsCache = new Map();
const MAX_CACHE_SIZE = 150;

// Locate python executable in workspace .venv or system PATH
const getPythonPath = () => {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  const venvPythonWin = path.resolve(PROJECT_ROOT, "../.venv/Scripts/python.exe");
  if (fs.existsSync(venvPythonWin)) {
    return venvPythonWin;
  }
  const venvPythonUnix = path.resolve(PROJECT_ROOT, "../.venv/bin/python");
  if (fs.existsSync(venvPythonUnix)) {
    return venvPythonUnix;
  }
  return "python";
};

export const sanitizeTtsText = (text = "") => {
  return text
    .replace(/```[\s\S]*?```/g, "Bagian kode ditampilkan di layar.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/https?:\/\/\S+/g, "tautan web")
    .replace(/[#*>-]/g, "")
    .replace(/\[EMOTE:[^\]]+\]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
};

export class EdgeTtsService {
  constructor() {
    this.defaultVoice = process.env.TTS_VOICE || "id-ID-GadisNeural";
    this.defaultPitch = process.env.TTS_PITCH || "+25Hz"; // Tuning cute anime AI
    this.defaultRate = process.env.TTS_RATE || "+10%";
  }

  createAudioStream({ text, voice, pitch, rate }) {
    const cleanText = sanitizeTtsText(text);
    if (!cleanText) {
      throw new Error("Text is required for TTS synthesis");
    }

    const selectedVoice = voice || this.defaultVoice;
    const selectedPitch = pitch || this.defaultPitch;
    const selectedRate = rate || this.defaultRate;
    const cacheKey = `${selectedVoice}|${selectedPitch}|${selectedRate}|${cleanText}`;

    // Return instant cached buffer if available
    if (ttsCache.has(cacheKey)) {
      const cached = ttsCache.get(cacheKey);
      logger.debug(`TTS Cache Hit for: "${cleanText.slice(0, 30)}"`);
      return Readable.from(cached);
    }

    const pythonBin = getPythonPath();
    const args = [
      STREAMER_SCRIPT,
      selectedVoice,
      selectedPitch,
      selectedRate,
    ];

    const child = spawn(pythonBin, args, { stdio: ["pipe", "pipe", "pipe"] });
    child.stdin.write(cleanText, "utf-8");
    child.stdin.end();

    const outputStream = new PassThrough();
    const collectedChunks = [];

    child.stdout.on("data", (chunk) => {
      collectedChunks.push(chunk);
      outputStream.write(chunk);
    });

    child.stdout.on("end", () => {
      outputStream.end();
      if (collectedChunks.length > 0) {
        const fullBuffer = Buffer.concat(collectedChunks);
        if (ttsCache.size >= MAX_CACHE_SIZE) {
          const firstKey = ttsCache.keys().next().value;
          ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, fullBuffer);
      }
    });

    child.on("error", (err) => {
      outputStream.destroy(err);
    });

    return outputStream;
  }
}

export const edgeTtsService = new EdgeTtsService();
