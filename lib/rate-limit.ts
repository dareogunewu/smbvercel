// Simple in-memory rate limiter for API routes
// For production, consider using a Redis-based solution like Upstash

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60 * 60 * 1000);

export interface RateLimitConfig {
  interval: number; // in milliseconds
  uniqueTokenPerInterval: number; // max requests per interval
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, uniqueTokenPerInterval } = config;

  return {
    check: (identifier: string): { success: boolean; remaining: number; reset: number } => {
      const now = Date.now();
      const key = `${identifier}`;

      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + interval,
        };

        return {
          success: true,
          remaining: uniqueTokenPerInterval - 1,
          reset: store[key].resetTime,
        };
      }

      if (store[key].count < uniqueTokenPerInterval) {
        store[key].count += 1;

        return {
          success: true,
          remaining: uniqueTokenPerInterval - store[key].count,
          reset: store[key].resetTime,
        };
      }

      return {
        success: false,
        remaining: 0,
        reset: store[key].resetTime,
      };
    },
  };
}

// Rate limit helpers for common use cases
export const apiRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10, // 10 requests per minute
});

export const uploadRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 5, // 5 uploads per minute
});
