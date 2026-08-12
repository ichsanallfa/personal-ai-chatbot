const parseAllowedUserIds = (allowedUserIdsEnv = "", ownerIdEnv = "") => {
  const values = [ownerIdEnv, allowedUserIdsEnv]
    .flatMap((value) => (value || "").split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(values)];
};

export const getAllowedUserIds = (env = process.env) => {
  return parseAllowedUserIds(env.ALLOWED_USER_IDS, env.DISCORD_OWNER_ID);
};

export const isAllowedUser = (userId, env = process.env, options = {}) => {
  if (!userId) {
    return false;
  }

  if (options.guildOwnerId && options.guildOwnerId === userId) {
    return true;
  }

  const rawAllowed = (env.ALLOWED_USER_IDS || "").trim().toLowerCase();

  // Jika ALLOWED_USER_IDS kosong, "*", atau "public", izinkan semua orang (Mode Publik)
  if (!rawAllowed || rawAllowed === "*" || rawAllowed === "public") {
    return true;
  }

  return getAllowedUserIds(env).includes(userId);
};
