import axios from "axios";
import { BaseAIProvider } from "./baseProvider.js";
import { config } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";

export class OpenAIProvider extends BaseAIProvider {
  constructor() {
    super("openai");
  }

  isAvailable() {
    return Boolean(config.openaiApiKey);
  }

  async generateCompletion({ systemPrompt, messages, model = "gpt-4o-mini" }) {
    if (!this.isAvailable()) {
      throw new Error("OpenAI API key is not configured");
    }

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    try {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, {
        headers: {
          Authorization: `Bearer ${config.openaiApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      });

      const reply = response.data?.choices?.[0]?.message?.content;
      if (!reply) {
        throw new Error("Empty response returned by OpenAI");
      }
      return reply;
    } catch (error) {
      logger.error("OpenAI provider error:", error.response?.data || error.message);
      throw error;
    }
  }
}
