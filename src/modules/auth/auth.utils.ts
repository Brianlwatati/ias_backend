// src/modules/auth/auth.utils.ts

import ms from "ms";

import { env } from "../../config/env.js";

import type {
  AuthUser,
  AuthResponse,
  AuthResponseUser,
  CompanySummary,
} from "./auth.types.js";

/**
 * Maps the DB's system role code to the fixed lowercase
 * enum the frontend expects. A user with no system role
 * (roleCode === null) is a regular product user → "member".
 */
function mapSystemRole(
  roleCode: string | null,
): "super_admin" | "company_admin" | "member" {
  switch (roleCode) {
    case "SUPER_ADMIN":
      return "super_admin";
    case "COMPANY_ADMIN":
      return "company_admin";
    default:
      return "member";
  }
}

export function toAuthResponseUser(
  user: AuthUser,
  company: CompanySummary | null,
): AuthResponseUser {
  return {
    id: String(user.id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName ?? "",
    roleId: user.roleId !== null ? String(user.roleId) : null,
    roleName: user.roleName,
    roleCode: user.roleCode,
    roleScope: user.roleScope,
    roleScopeKey: user.roleScopeKey,
    companyId: user.companyId !== null ? String(user.companyId) : null,
    company,
    isActive: user.status === "ACTIVE",
  };
}

/**
 * expiresIn is derived from JWT_ACCESS_EXPIRES_IN (e.g. "15m")
 * and expressed in whole seconds, matching typical JWT/OAuth
 * client conventions (frontends usually expect seconds, not ms).
 */
function getAccessTokenExpiresInSeconds(): number {
  const durationMs = ms(env.JWT_ACCESS_EXPIRES_IN);

  if (typeof durationMs !== "number") {
    throw new Error(
      `Invalid JWT_ACCESS_EXPIRES_IN value: "${env.JWT_ACCESS_EXPIRES_IN}"`,
    );
  }

  return Math.floor(durationMs / 1000);
}

export function buildAuthResponse(
  user: AuthUser,
  company: CompanySummary | null,
  accessToken: string,
  refreshToken: string,
): AuthResponse {
  return {
    user: toAuthResponseUser(user, company),
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: getAccessTokenExpiresInSeconds(),
    },
  };
}
