import app from "./app.js";
import { config } from "./config/env.js";
import { memoryService } from "./services/memory/memoryService.js";
import { reminderService } from "./services/reminder/reminderService.js";
import { vtubeService } from "./services/vtube/vtubeService.js";
import { closeDatabase } from "./storage/sqliteStorage.js";
import { logger } from "./utils/logger.js";

/**
 * Initialise all backend services and start the Express server.
 * Returns the underlying http.Server instance for further handling
 * (e.g., graceful shutdown).
 * @returns {import('http').Server}
 */

export const startServer = () => {
  logger.info("Initializing Lucy AI Backend Services...");

  // Initialize Memory
  memoryService.initialize();

  // Start Reminder Background Scheduler
  reminderService.startScheduler();

  // Initialize VTube Studio Connection
  vtubeService.initialize();

  // Auto-start bots if enabled and tokens exist
  if (config.autoStartBots) {
    if (config.discordBotToken) {
      import("./bots/discordBot.js")
        .then(({ startDiscordBot }) => {
          logger.info("Auto-starting Discord bot...");
          return startDiscordBot();
        })
        .catch((err) => logger.warn(`Failed to auto-start Discord bot: ${err.message}`));
    }
    if (config.telegramBotToken) {
      import("./bots/telegramBot.js")
        .then(({ startTelegramBot }) => {
          logger.info("Auto-starting Telegram bot...");
          return startTelegramBot();
        })
        .catch((err) => logger.warn(`Failed to auto-start Telegram bot: ${err.message}`));
    }
  }

  const server = app.listen(config.port, () => {
    logger.info(`=========================================`);
    logger.info(`🤖 Lucy AI Backend Server running on port ${config.port}`);
    logger.info(`🧠 Active AI Provider: ${config.aiProvider}`);
    logger.info(`🕒 System Time (WIB): ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`);
    logger.info(`📡 Health Check: http://localhost:${config.port}/api/health`);
    logger.info(`=========================================`);
  });

  return server;
};

// Run server only when executed directly
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));
if (isMain) {
  const server = startServer();
  // Graceful shutdown on termination signals
  const shutdown = async () => {
    logger.info("Shutting down Lucy AI Backend Server...");

    reminderService.stopScheduler();
    vtubeService.disconnect();

    try {
      const { stopDiscordBot } = await import("./bots/discordBot.js");
      await stopDiscordBot();
    } catch {
      // Ignored if bot not active
    }

    try {
      const { stopTelegramBot } = await import("./bots/telegramBot.js");
      await stopTelegramBot();
    } catch {
      // Ignored if bot not active
    }

    try {
      closeDatabase();
    } catch {
      // Ignored
    }

    server.close(() => {
      logger.info("Server closed. Exiting process.");
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
  });
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    shutdown();
  });
}

export default app;
