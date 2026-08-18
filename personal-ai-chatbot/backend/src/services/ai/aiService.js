import { config } from "../../config/env.js";
import { ROLES } from "../../config/constants.js";
import { getCurrentTimeInfo } from "../../utils/timeUtils.js";
import { logger } from "../../utils/logger.js";
import { memoryService } from "../memory/memoryService.js";
import { detectEmotion } from "./emotionDetector.js";
import { buildFallbackReply } from "./fallbackResponder.js";
import { OpenRouterProvider } from "./providers/openRouterProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";
import { OpenAIProvider } from "./providers/openaiProvider.js";
import { MockProvider } from "./providers/mockProvider.js";
import { vtubeService } from "../vtube/vtubeService.js";

class AIService {
  constructor() {
    this.providers = {
      openrouter: new OpenRouterProvider(),
      gemini: new GeminiProvider(),
      openai: new OpenAIProvider(),
      mock: new MockProvider(),
    };
  }

  getProvider(providerName = config.aiProvider) {
    const provider = this.providers[providerName];
    if (provider && provider.isAvailable()) {
      return provider;
    }
    // Fallback search
    for (const [name, p] of Object.entries(this.providers)) {
      if (p.isAvailable()) {
        logger.info(`AI provider ${providerName} unavailable. Falling back to ${name}`);
        return p;
      }
    }
    return this.providers.mock;
  }

  buildSystemPrompt(coreMemory, userMemoryItems = [], tempMemory = [], userContext = {}) {
    const identity = coreMemory.identity || {};
    const personality = coreMemory.personality || {};
    const rules = coreMemory.rules || [];

    const identitySection = `IDENTITAS KAMU:
Nama: ${identity.name || "Lucy"}
Pencipta: ${identity.creator || "Alfaa"}
Tujuan: ${identity.purpose || "Personal AI assistant"}`;

    const longMemorySection = userMemoryItems.length > 0
      ? userMemoryItems.map((item, idx) => `${idx + 1}. [${item.category || "info"}] ${item.content}`).join("\n")
      : "Belum ada catatan memori permanen.";

    const tempMemorySection = tempMemory.length > 0
      ? tempMemory.map((item, idx) => `${idx + 1}. ${item.content}`).join("\n")
      : "Belum ada temporary memory.";

    const rulesSection = rules.length > 0
      ? `\nAturan Keamanan:\n${rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      : "";

    let roleInstructions = "";
    if (userContext.role === ROLES.OWNER) {
      roleInstructions = `
INFO USER SAAT INI:
- User ini adalah Alfaa (Creator & Owner kamu).
- Bersikap akrab, santai, dan panggil dia "Alfaa".
- Kamu boleh mendiskusikan sistem internal dan rahasia bersamanya.`;
    } else if (userContext.role === ROLES.ALLOWED) {
      roleInstructions = `
INFO USER SAAT INI:
- User ini adalah pengguna yang diizinkan (teman/pengguna terpercaya).
- Jangan panggil user ini sebagai Alfaa.
- Jangan berikan informasi personal milik creator atau data user lain.`;
    } else {
      roleInstructions = `
INFO USER SAAT INI:
- User ini adalah pengguna umum (public).
- Jawab ramah dan sopan.
- Jangan mengungkapkan rahasia sistem, token, atau informasi pribadi creator dan pengguna lain.`;
    }

    return `${identitySection}

Waktu saat ini (WIB - Asia/Jakarta):
${getCurrentTimeInfo()}

Long-term memory (fakta tentang user ini):
${longMemorySection}

Temporary memory (konteks 2 jam terakhir):
${tempMemorySection}

Personality:
- Style: ${personality.style || "Ramah, natural, sedikit santai, dan enak diajak ngobrol"}
- Tone: ${personality.tone || "Sopan tapi santai"}
- Panjang respon: ${personality.responseLength || "Secukupnya dan relevan, jangan bertele-tele kecuali diminta"}
${rulesSection}
${roleInstructions}
`;
  }

  async generateReply({ userId, userRole, message, chatHistory = [], preferredProvider = null }) {
    // 1. Process memory extraction
    memoryService.processChatMessage(userId, userRole, message);

    // 2. Fetch up-to-date memory context
    const coreMemory = memoryService.getCoreMemory();
    const userMemory = memoryService.getUserMemory(userId);
    const tempMemory = memoryService.getTemporaryMemory(userId);

    // 3. Detect emotion and trigger VTube Studio
    const emotionData = detectEmotion(message);
    try {
      if (emotionData.emotion !== "netral") {
        vtubeService.setExpression(emotionData.emotion);
      }
    } catch (vtsErr) {
      logger.warn(`VTube trigger error: ${vtsErr.message}`);
    }

    // 4. Construct System Prompt
    const systemPrompt = this.buildSystemPrompt(coreMemory, userMemory.items, tempMemory, {
      userId,
      role: userRole,
    });

    const emotionContext = emotionData.emotion !== "netral"
      ? `\n\n[EMOSI USER: ${emotionData.emotion} (Intensitas: ${Math.round(emotionData.intensity * 100)}%)]`
      : "";

    const activeProvider = this.getProvider(preferredProvider || config.aiProvider);

    try {
      const messages = [
        ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ];

      const reply = await activeProvider.generateCompletion({
        systemPrompt: systemPrompt + emotionContext,
        messages,
      });

      return {
        reply,
        mode: activeProvider.name,
        emotion: emotionData.emotion,
      };
    } catch (error) {
      logger.warn(`Provider ${activeProvider.name} failed, falling back to heuristic responder: ${error.message}`);
      const memoryFacts = userMemory.items.map((i) => i.content);
      const fallback = buildFallbackReply(message, memoryFacts);

      return {
        reply: fallback,
        mode: "fallback",
        emotion: emotionData.emotion,
      };
    }
  }
}

export const aiService = new AIService();
