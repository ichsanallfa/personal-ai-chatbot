import { authService } from "../services/auth/authService.js";
import { identityService } from "../services/auth/identityService.js";
import { ROLES } from "../config/constants.js";
import { UnauthorizedError } from "../utils/appError.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const serviceKey = req.headers["x-service-key"];
    const legacyUserId = req.headers["x-user-id"];
    const platform = req.headers["x-platform"] || "web";

    // 1. JWT Bearer Token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = authService.verifyToken(token);
      req.user = decoded;
      return next();
    }

    // 2. Verified Bot-to-Backend Service Gateway
    if (serviceKey) {
      if (!legacyUserId) {
        throw new UnauthorizedError("x-user-id header is required when using x-service-key");
      }
      const botUser = authService.authenticateBotRequest(serviceKey, platform, legacyUserId);
      req.user = botUser;
      return next();
    }

    // 3. Fallback / Public Mode (Strictly prevents spoofing owner/allowed roles)
    if (legacyUserId) {
      const canonicalId = identityService.resolveCanonicalUserId(platform, legacyUserId);
      req.user = {
        userId: canonicalId,
        platformUserId: legacyUserId,
        platform,
        role: ROLES.PUBLIC, // Unauthenticated requests can NEVER obtain owner/allowed role!
      };
      return next();
    }

    req.user = null;
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireAuth = (req, res, next) => {
  authenticate(req, res, (err) => {
    if (err) return next(err);
    if (!req.user || !req.user.userId) {
      return next(new UnauthorizedError("Authentication required. Please provide a valid Bearer token or service key."));
    }
    return next();
  });
};
