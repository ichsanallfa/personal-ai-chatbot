import { ROLES } from "../config/constants.js";
import { ForbiddenError, UnauthorizedError } from "../utils/appError.js";

export const requireRole = (allowedRoles = []) => {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!rolesArray.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Required role [${rolesArray.join(", ")}], but current user has role [${req.user.role || "none"}]`
        )
      );
    }

    return next();
  };
};

export const requireOwner = requireRole([ROLES.OWNER]);
export const requireAllowedOrOwner = requireRole([ROLES.OWNER, ROLES.ALLOWED]);
