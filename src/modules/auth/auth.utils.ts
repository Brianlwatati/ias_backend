import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../../config/env.js";

/**
 * JWT payload used when generating access tokens.
 */
export interface AccessTokenPayload {
  sub: string;
  role?: string;
  companyId?: string;
}

/**
 * Generate a short-lived access token.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    issuer: env.JWT_ISSUER,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/**
 * Generate a cryptographically secure
 * random refresh token.
 *
 * The raw token is returned to the client.
 * Only its SHA-256 hash is stored in MySQL.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Hash a refresh token before storing it
 * in the database.
 *
 * SHA-256 is appropriate here because the
 * refresh token itself is already generated
 * using cryptographically secure randomness.
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Hash a user's password.
 *
 * Passwords use bcrypt because they are
 * user-controlled secrets and therefore need
 * a deliberately slow password hashing algorithm.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;

  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain-text password against
 * the stored bcrypt hash.
 */
export async function comparePassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
