import { aiService } from "../services/ai/aiService.js";
import { chatHistoryService } from "../services/memory/chatHistoryService.js";
import { ROLES } from "../config/constants.js";

export const handleChat = async (req, res, next) => {
  try {
    const { message, preferredProvider } = req.body;
    const userId = req.user?.userId || req.headers["x-user-id"] || "anonymous_user";
    const userRole = req.user?.role || ROLES.PUBLIC;

    // Load recent conversation history
    const history = chatHistoryService.getHistory(userId);

    // Generate AI response
    const result = await aiService.generateReply({
      userId,
      userRole,
      message,
      chatHistory: history,
      preferredProvider,
    });

    // Save assistant reply to conversation history
    chatHistoryService.appendTurn(userId, message, result.reply);

    // Provide standard response envelope, with backward-compatible reply field
    res.json({
      success: true,
      reply: result.reply, // Backward compatibility for legacy clients/bots
      data: {
        reply: result.reply,
        mode: result.mode,
        emotion: result.emotion,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const history = chatHistoryService.getHistory(userId);
    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    next(error);
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    chatHistoryService.clearHistory(userId);
    res.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
