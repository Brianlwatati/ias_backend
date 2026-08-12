import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";

import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import {
  AccessTokenPayload,
  AccessTokenUser,
  AuthUser,
} from "../modules/auth/auth.types.js";

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

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
    });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.sub !== "string"
    ) {
      throw new UnauthorizedError("Invalid access token");
    }

    const payload = decoded as JwtPayload;

    return {
      sub: payload.sub as string,

      ...(typeof payload.role === "string"
        ? {
            role: payload.role,
          }
        : {}),

      ...(typeof payload.companyId === "string"
        ? {
            companyId: payload.companyId,
          }
        : {}),
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError("Invalid or expired access token");
  }
}

export function buildAccessTokenPayload(
  user: AccessTokenUser,
): AccessTokenPayload {
  return {
    sub: String(user.id),
    ...(user.roleCode ? { role: user.roleCode } : {}),
    ...(user.companyId !== null ? { companyId: String(user.companyId) } : {}),
  };
}
