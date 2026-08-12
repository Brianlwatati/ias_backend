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

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  type?: string;
  role?: string;
  companyId?: string;
}

import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: number;
    role: string | null;
    companyId: number | null;
  };
}
