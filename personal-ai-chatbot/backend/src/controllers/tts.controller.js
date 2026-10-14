import { edgeTtsService } from "../services/voice/edgeTtsService.js";
import { ValidationError } from "../utils/appError.js";

export const handleTts = async (req, res, next) => {
  try {
    const text = req.body?.text || req.query?.text;
    const voice = req.body?.voice || req.query?.voice;
    const pitch = req.body?.pitch || req.query?.pitch;
    const rate = req.body?.rate || req.query?.rate;

    if (!text || typeof text !== "string" || !text.trim()) {
      throw new ValidationError("Parameter text is required");
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const audioStream = edgeTtsService.createAudioStream({ text, voice, pitch, rate });
    audioStream.pipe(res);

    audioStream.on("error", (err) => {
      if (!res.headersSent) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
};
