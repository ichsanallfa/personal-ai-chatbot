import { config } from "../config/env.js";
import { RateLimitError } from "../utils/appError.js";

class MemoryRateLimiter {
  constructor(windowMs, maxRequests) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.store = new Map();

    // Auto cleanup expired entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      }
    }, this.windowMs * 2);
  }

  middleware(customMax = null) {
    const limit = customMax || this.maxRequests;

    return (req, res, next) => {
      // Owner or bot service keys can bypass rate limiting
      if (req.user?.role === "owner" || req.user?.isBotService) {
        return next();
      }

      const key = req.user?.userId || req.ip || "anonymous";
      const now = Date.now();

      if (!this.store.has(key)) {
        this.store.set(key, { count: 1, resetTime: now + this.windowMs });
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", limit - 1);
        return next();
      }

      const record = this.store.get(key);
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + this.windowMs;
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader("X-RateLimit-Remaining", limit - 1);
        return next();
      }

      if (record.count >= limit) {
        const retryAfterMs = record.resetTime - now;
        res.setHeader("Retry-After", Math.ceil(retryAfterMs / 1000));
        return next(new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 1000)}s`, retryAfterMs));
      }

      record.count++;
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", limit - record.count);
      return next();
    };
  }
}

export const chatRateLimiter = new MemoryRateLimiter(config.rateLimitWindowMs, config.rateLimitMaxChat).middleware();
export const authRateLimiter = new MemoryRateLimiter(config.rateLimitWindowMs, config.rateLimitMaxAuth).middleware();
export const generalRateLimiter = new MemoryRateLimiter(config.rateLimitWindowMs, config.rateLimitMaxGeneral).middleware();
