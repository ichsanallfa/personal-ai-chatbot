import { getCurrentTimeInfo } from "../utils/timeUtils.js";
import { config } from "../config/env.js";
import { vtubeService } from "../services/vtube/vtubeService.js";

export const getHealth = async (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      service: "Lucy AI Backend",
      version: "2.0.0",
      currentTimeWIB: getCurrentTimeInfo(),
      activeAIProvider: config.aiProvider,
      vtubeConnected: vtubeService.getStatus().connected,
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
};
