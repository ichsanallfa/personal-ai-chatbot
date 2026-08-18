import axios from "axios";
import { BaseAIProvider } from "./baseProvider.js";
import { config } from "../../../config/env.js";
import { logger } from "../../../utils/logger.js";

export class OpenRouterProvider extends BaseAIProvider {
  constructor() {
    super("openrouter");
  }

  isAvailable() {
    return Boolean(config.openRouterApiKey);
  }

  async generateCompletion({ systemPrompt, messages, model = config.aiModel }) {
    if (!this.isAvailable()) {
      throw new Error("OpenRouter API key is not configured");
    }

    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    };

    try {
      const response = await axios.post(config.openRouterUrl, payload, {
        headers: {
          Authorization: `Bearer ${config.openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/ichsanallfa/personal-ai-chatbot",
          "X-Title": "Lucy AI Assistant",
        },
        timeout: 30000,
      });

      const reply = response.data?.choices?.[0]?.message?.content;
      if (!reply) {
        throw new Error("Empty response returned by OpenRouter");
      }
      return reply;
    } catch (error) {
      logger.error("OpenRouter provider error:", error.response?.data || error.message);
      throw error;
    }
  }
}
