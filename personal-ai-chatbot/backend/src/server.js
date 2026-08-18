import app from "./app.js";
import { config } from "./config/env.js";
import { memoryService } from "./services/memory/memoryService.js";
import { reminderService } from "./services/reminder/reminderService.js";
import { vtubeService } from "./services/vtube/vtubeService.js";
import { logger } from "./utils/logger.js";

export const startServer = () => {
  logger.info("Initializing Lucy AI Backend Services...");

  // Initialize Memory
  memoryService.initialize();

  // Start Reminder Background Scheduler
  reminderService.startScheduler();

  // Initialize VTube Studio Connection
  vtubeService.initialize();

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

// Check if running directly as main script
const isMain = process.argv[1] && (
  process.argv[1].endsWith("src/server.js") ||
  process.argv[1].endsWith("src\\server.js") ||
  process.argv[1].endsWith("server.js")
);

if (isMain) {
  startServer();
}

export default app;
