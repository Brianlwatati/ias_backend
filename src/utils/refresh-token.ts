// src/utils/refresh-token.ts

import crypto from "node:crypto";

/**
 * Generate a cryptographically secure
 * random refresh token.
 *
 * The raw token is returned to the client.
 * Only its hash is stored in PostgreSQL.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Hash a refresh token before storing it
 * in the database.
 *
 * SHA-256 is suitable here because the
 * refresh token itself is generated using
 * cryptographically secure randomness.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
