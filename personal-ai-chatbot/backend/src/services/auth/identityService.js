import { IDENTITIES_FILE } from "../../config/paths.js";
import { loadJsonFile, saveJsonFile } from "../../storage/jsonStorage.js";
import { logger } from "../../utils/logger.js";

class IdentityService {
  constructor() {
    this.cache = null;
  }

  getIdentities() {
    if (!this.cache) {
      this.cache = loadJsonFile(IDENTITIES_FILE, { users: {}, platformLookup: {} });
      if (!this.cache.users) this.cache.users = {};
      if (!this.cache.platformLookup) this.cache.platformLookup = {};
    }
    return this.cache;
  }

  save() {
    if (this.cache) {
      saveJsonFile(IDENTITIES_FILE, this.cache);
    }
  }

  /**
   * Get canonical user ID by platform and platform user ID
   */
  resolveCanonicalUserId(platform, platformUserId) {
    if (!platform || !platformUserId) return null;
    const lookupKey = `${platform}:${platformUserId}`;
    const data = this.getIdentities();
    
    if (data.platformLookup[lookupKey]) {
      return data.platformLookup[lookupKey];
    }

    // Auto-create identity if not existing
    const canonicalId = `user_${platform}_${platformUserId}`;
    data.users[canonicalId] = {
      canonicalId,
      createdAt: Date.now(),
      platforms: {
        [platform]: platformUserId,
      },
    };
    data.platformLookup[lookupKey] = canonicalId;
    this.save();
    return canonicalId;
  }

  /**
   * Link an additional platform to an existing canonical user ID
   */
  linkPlatform(canonicalUserId, platform, platformUserId) {
    const data = this.getIdentities();
    if (!data.users[canonicalUserId]) {
      data.users[canonicalUserId] = {
        canonicalId: canonicalUserId,
        createdAt: Date.now(),
        platforms: {},
      };
    }

    data.users[canonicalUserId].platforms[platform] = platformUserId;
    data.platformLookup[`${platform}:${platformUserId}`] = canonicalUserId;
    this.save();
    logger.info(`Linked platform ${platform}:${platformUserId} to canonical user ${canonicalUserId}`);
    return data.users[canonicalUserId];
  }

  /**
   * Get user identity info
   */
  getUserIdentity(canonicalUserId) {
    const data = this.getIdentities();
    return data.users[canonicalUserId] || null;
  }
}

export const identityService = new IdentityService();
