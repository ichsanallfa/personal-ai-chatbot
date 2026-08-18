import { BaseAIProvider } from "./baseProvider.js";
import { buildFallbackReply } from "../fallbackResponder.js";

export class MockProvider extends BaseAIProvider {
  constructor() {
    super("mock");
  }

  isAvailable() {
    return true;
  }

  async generateCompletion({ messages }) {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    return buildFallbackReply(lastUserMessage, []);
  }
}
