import { authService } from "./src/services/auth/authService.js";
import { config } from "./src/config/env.js";
import { ROLES } from "./src/config/constants.js";

export const getAllowedUserIds = (env = process.env) => {
  const discordOwner = env.DISCORD_OWNER_ID || config.discordOwnerId;
  const allowed = (env.ALLOWED_USER_IDS || env.DISCORD_ALLOWED_USERS || config.discordAllowedUsers.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return [...new Set([discordOwner, ...allowed].filter(Boolean))];
};

export const isAllowedUser = (userId, env = process.env, options = {}) => {
  if (!userId) return false;
  if (options.guildOwnerId && options.guildOwnerId === userId) return true;

  const rawAllowed = (env.ALLOWED_USER_IDS || "").trim().toLowerCase();
  if (!rawAllowed || rawAllowed === "*" || rawAllowed === "public") {
    return true;
  }

  const role = authService.evaluateRole("discord", userId);
  return role === ROLES.OWNER || role === ROLES.ALLOWED;
};

export const isOwnerUser = (userId, env = process.env) => {
  if (!userId) return false;
  const ownerId = (env.DISCORD_OWNER_ID || config.discordOwnerId || "").trim();
  return ownerId === userId.toString().trim() || config.ownerUserIds.includes(userId.toString().trim());
};
