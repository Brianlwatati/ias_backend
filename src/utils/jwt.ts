// src/utils/jwt.ts

import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env.js";

import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { AccessTokenPayload, AccessTokenUser } from "./jwt.types.js";

/**
 * Generate a short-lived access token.
 *
 * Signed with issuer + audience so that tokens issued by
 * this auth service cannot be replayed against a different
 * product's API by mistake or by an attacker.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
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
      companyId: payload.companyId as string,
      roleName: payload.roleName as string,
      roleCode: payload.roleCode as string,
      roleScope: payload.roleScope as string,
      roleScopeKey: payload.roleScopeKey as string,
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
    sub: String(user.userId),
    companyId: String(user.companyId),
    roleName: user.roleName,
    roleCode: user.roleCode,
    roleScope: user.roleScope,
    roleScopeKey: user.roleScopeKey,
  };
}
