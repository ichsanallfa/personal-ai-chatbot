import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { PROJECT_ROOT } from "../../config/paths.js";
import { logger } from "../../utils/logger.js";

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
    this.defaultRate = process.env.TTS_RATE || "+8%";
  }

  createAudioStream({ text, voice, pitch, rate }) {
    const cleanText = sanitizeTtsText(text);
    if (!cleanText) {
      throw new Error("Text is required for TTS synthesis");
    }

    const selectedVoice = voice || this.defaultVoice;
    const selectedPitch = pitch || this.defaultPitch;
    const selectedRate = rate || this.defaultRate;

    const pythonBin = getPythonPath();
    const args = [
      "-m",
      "edge_tts",
      "--no-progress",
      "--voice",
      selectedVoice,
      "--pitch",
      selectedPitch,
      "--rate",
      selectedRate,
      "-f",
      "-",
      "--write-media",
      "-",
    ];

    logger.debug(`Spawning TTS: ${pythonBin} voice=${selectedVoice}`);
    const child = spawn(pythonBin, args, { stdio: ["pipe", "pipe", "pipe"] });

    child.stdin.write(cleanText, "utf-8");
    child.stdin.end();

    child.stderr.on("data", (chunk) => {
      logger.debug(`edge-tts stderr: ${chunk.toString()}`);
    });

    return child.stdout;
  }
}

export const edgeTtsService = new EdgeTtsService();
