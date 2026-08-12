// src/middleware/rateLimiters.ts

import rateLimit from "express-rate-limit";

/**
 * General-purpose limiter applied globally.
 *
 * Loose on purpose — this is a baseline DoS guard,
 * not a brute-force guard. Sensitive endpoints
 * (login, refresh) get their own stricter limiter
 * below, applied on top of this one.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

/**
 * Strict limiter for authentication endpoints
 * (login, refresh) to slow down credential
 * stuffing / brute-force attempts.
 *
 * Consider keying this by email + IP instead of
 * IP alone once you have a real user base, so a
 * shared office/NAT IP doesn't lock everyone out
 * because of one bad actor.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
    code: "RATE_LIMITED",
  },
});
