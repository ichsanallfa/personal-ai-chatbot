import { vtubeService } from "../services/vtube/vtubeService.js";

export const getVTubeStatus = async (req, res, next) => {
  try {
    const status = vtubeService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

export const triggerExpression = async (req, res, next) => {
  try {
    const { expression } = req.body;
    const triggered = vtubeService.setExpression(expression);
    res.json({
      success: true,
      data: { triggered, expression },
      message: triggered ? `Triggered expression: ${expression}` : "Failed to trigger expression (check VTS connection)",
    });
  } catch (error) {
    next(error);
  }
};

export const reconnectVTube = async (req, res, next) => {
  try {
    vtubeService.connect();
    res.json({
      success: true,
      message: "Attempting reconnection to VTube Studio...",
    });
  } catch (error) {
    next(error);
  }
};
