import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";

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
 * Verify an access token.
 *
 * This will be used by the authentication
 * middleware later.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: env.JWT_ISSUER,
  });

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof decoded.sub !== "string"
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    sub: decoded.sub,

    ...(typeof decoded.role === "string"
      ? {
          role: decoded.role,
        }
      : {}),

    ...(typeof decoded.companyId === "string"
      ? {
          companyId: decoded.companyId,
        }
      : {}),
  };
}
