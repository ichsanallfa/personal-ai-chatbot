import axios from "axios";
import { BaseAIProvider } from "./baseProvider.js";
import { config } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";

export class GeminiProvider extends BaseAIProvider {
  constructor() {
    super("gemini");
  }

  isAvailable() {
    return Boolean(config.geminiApiKey);
  }

  async generateCompletion({ systemPrompt, messages, model = "gemini-1.5-flash" }) {
    if (!this.isAvailable()) {
      throw new Error("Gemini API key is not configured");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`;

    const contents = [
      {
        role: "user",
        parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }],
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    try {
      const response = await axios.post(endpoint, { contents }, { timeout: 30000 });
      const candidate = response.data?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response returned by Gemini API");
      }
      return text;
    } catch (error) {
      logger.error("Gemini provider error:", error.response?.data || error.message);
      throw error;
    }
  }
}
