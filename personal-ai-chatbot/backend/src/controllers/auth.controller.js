import { authService } from "../services/auth/authService.js";
import { identityService } from "../services/auth/identityService.js";

export const loginOwner = async (req, res, next) => {
  try {
    const { secretKey } = req.body;
    const result = authService.authenticateOwner(secretKey);
    res.json({
      success: true,
      data: result,
      message: "Owner authenticated successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getWebSession = async (req, res, next) => {
  try {
    const { userId } = req.body || {};
    const result = authService.authenticateWebUser(userId);
    res.json({
      success: true,
      data: result,
      message: "Web session created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const linkIdentity = async (req, res, next) => {
  try {
    const { platform, platformUserId } = req.body;
    const linked = identityService.linkPlatform(req.user.userId, platform, platformUserId);
    res.json({
      success: true,
      data: linked,
      message: `Account successfully linked to ${platform}:${platformUserId}`,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
        identity: identityService.getUserIdentity(req.user?.userId),
      },
    });
  } catch (error) {
    next(error);
  }
};
