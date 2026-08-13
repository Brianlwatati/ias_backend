// src/modules/auth/auth.types.ts

export interface AuthUser {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string | null;

  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

  companyId: number | null;

  roleId: number | null;
  roleCode: string | null;

  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
}

export interface AccessTokenUser {
  id: number;
  roleCode: string | null;
  companyId: number | null;
}

export interface RefreshTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface AuthResponseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "company_admin" | "member";
  companyId: string | null;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthResponseUser;
  tokens: AuthTokens;
}

export interface AccessTokenPayload {
  sub: string;
  type?: string;
  role?: string | null;
  companyId?: number | string | null;
}

import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: number;
    role: string | null;
    companyId: number | null;
  };
}
