// src/modules/auth/auth.types.ts

export interface AuthUser {
  userId: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";
  companyId: number;
  roleId: number;
  roleName: string;
  roleCode: string;
  roleScope: string;
  roleScopeKey: string;

  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
}

export interface RefreshTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface CompanySummary {
  id: number;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface AuthResponseUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string | null;
  roleCode: string | null;
  roleScope: string | null;
  roleScopeKey: string | null;
  roleId: string | null;
  companyId: string | null;
  company: CompanySummary | null;
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

import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: number;
    role: string | null;
    companyId: number | null;
  };
}
