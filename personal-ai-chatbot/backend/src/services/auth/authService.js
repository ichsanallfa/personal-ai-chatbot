import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";
import { ROLES } from "../../config/constants.js";
import { identityService } from "./identityService.js";
import { UnauthorizedError } from "../../utils/appError.js";

class AuthService {
  /**
   * Generates a signed JWT token
   */
  generateToken(payload, expiresIn = config.jwtExpiresIn) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn });
  }

  /**
   * Verifies and decodes a JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired authentication token", {
        reason: error.message,
      });
    }
  }

  /**
   * Evaluates role based on platform user ID and verified authentication
   */
  evaluateRole(platform, platformUserId, isOwnerAuthenticated = false) {
    if (isOwnerAuthenticated) {
      return ROLES.OWNER;
    }

    if (!platformUserId) {
      return ROLES.PUBLIC;
    }

    const currentUserId = platformUserId.toString().trim();

    // Check owner IDs
    if (
      (platform === "discord" && currentUserId === config.discordOwnerId) ||
      (platform === "telegram" && currentUserId === config.telegramOwnerId) ||
      config.ownerUserIds.includes(currentUserId)
    ) {
      return ROLES.OWNER;
    }

    // Check allowed users
    if (
      (platform === "discord" && config.discordAllowedUsers.includes(currentUserId)) ||
      (platform === "telegram" && config.telegramAllowedUsers.includes(currentUserId)) ||
      config.allowedUserIds.includes(currentUserId)
    ) {
      return ROLES.ALLOWED;
    }

    return ROLES.USER;
  }

  /**
   * Authenticate owner using Owner Secret Key / Password
   */
  authenticateOwner(secretKey) {
    if (!secretKey || secretKey !== config.ownerSecretKey) {
      throw new UnauthorizedError("Invalid owner credentials");
    }

    const canonicalId = "owner_alfaa";
    const token = this.generateToken({
      userId: canonicalId,
      platform: "web",
      platformUserId: "owner",
      role: ROLES.OWNER,
    });

    return {
      token,
      user: {
        userId: canonicalId,
        role: ROLES.OWNER,
        platform: "web",
      },
    };
  }

  /**
   * Authenticate / create guest or user session for Web
   */
  authenticateWebUser(webUserId = null) {
    const rawId = webUserId || `web_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const canonicalId = identityService.resolveCanonicalUserId("web", rawId);
    const role = this.evaluateRole("web", rawId);

    const token = this.generateToken({
      userId: canonicalId,
      platform: "web",
      platformUserId: rawId,
      role,
    });

    return {
      token,
      user: {
        userId: canonicalId,
        platformUserId: rawId,
        role,
        platform: "web",
      },
    };
  }

  /**
   * Authenticates Bot-to-Backend Service request (preventing header spoofing)
   */
  authenticateBotRequest(serviceKey, platform, platformUserId) {
    if (!serviceKey || serviceKey !== config.serviceApiKey) {
      throw new UnauthorizedError("Invalid service API key for bot gateway");
    }

    const canonicalId = identityService.resolveCanonicalUserId(platform, platformUserId);
    const role = this.evaluateRole(platform, platformUserId);

    return {
      userId: canonicalId,
      platformUserId,
      platform,
      role,
      isBotService: true,
    };
  }
}

export const authService = new AuthService();
