// src/modules/auth/auth.service.ts

import type { Pool, PoolClient } from "pg";

import { AuthRepository } from "./auth.repository.js";

import { comparePassword } from "../../utils/password.js";

import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../utils/refresh-token.js";

import {
  generateAccessToken,
  buildAccessTokenPayload,
} from "../../utils/jwt.js";

import { buildAuthResponse } from "./auth.utils.js";

import { withTransaction } from "../../database/transaction.js";

import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { ForbiddenError } from "../../errors/ForbiddenError.js";

import ms from "ms";
import { env } from "../../config/env.js";

import type { AuthResponse, AuthUser, CompanySummary } from "./auth.types.js";
import type { LoginInput, RefreshInput } from "./auth.validation.js";

import { DUMMY_PASSWORD_HASH } from "./auth_dumy.js";

export interface CompanyLookup {
  findById(id: number): Promise<CompanySummary | null>;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly companies: CompanyLookup,
    private readonly db: Pool,
  ) {}

  async login(input: LoginInput): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();

    const user = await this.repository.findUserByEmail(email);

    /**
     * Always run the password comparison, even when the user
     * doesn't exist, so that "no such user" and "wrong password"
     * take the same amount of time — prevents email enumeration
     * via response timing.
     */
    const passwordValid = await comparePassword(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || !passwordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new ForbiddenError("Account is not active");
    }

    const company =
      user.companyId !== null
        ? await this.companies.findById(user.companyId)
        : null;

    const accessToken = this.createAccessToken({
      ...user,
      userId: user.userId,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiration();

    await this.repository.createRefreshToken(
      user.userId,
      refreshTokenHash,
      refreshTokenExpiresAt,
    );

    await this.repository.updateLastLogin(user.userId);

    return buildAuthResponse(user, company, accessToken, refreshToken);
  }

  async refresh(input: RefreshInput): Promise<AuthResponse> {
    const tokenHash = hashRefreshToken(input.refreshToken);

    return withTransaction(this.db, async (connection) => {
      const storedToken = await this.repository.findRefreshTokenForUpdate(
        tokenHash,
        connection,
      );

      if (!storedToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      if (storedToken.revokedAt) {
        /**
         * A revoked token being presented again means either a
         * stale retry or theft occurring after legitimate rotation.
         * Treat it as a compromise and kill every session.
         */
        await this.repository.revokeAllUserRefreshTokens(storedToken.userId);

        throw new UnauthorizedError(
          "Refresh token has been revoked. All sessions have been logged out.",
        );
      }

      if (new Date(storedToken.expiresAt).getTime() <= Date.now()) {
        throw new UnauthorizedError("Refresh token has expired");
      }

      const user = await this.repository.findUserById(
        storedToken.userId,
        connection,
      );

      if (!user) {
        throw new UnauthorizedError("User no longer exists");
      }

      if (user.status !== "ACTIVE") {
        throw new ForbiddenError("Account is not active");
      }

      await this.repository.revokeRefreshToken(storedToken.id, connection);

      const newRefreshToken = generateRefreshToken();
      const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
      const newRefreshTokenExpiresAt = this.getRefreshTokenExpiration();

      await this.repository.createRefreshToken(
        user.userId,
        newRefreshTokenHash,
        newRefreshTokenExpiresAt,
        connection,
      );

      const company =
        user.companyId !== null
          ? await this.companies.findById(user.companyId)
          : null;

      const accessToken = this.createAccessToken(user);

      return buildAuthResponse(user, company, accessToken, newRefreshToken);
    });
  }

  async revokeSession(refreshToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      return;
    }

    if (storedToken.revokedAt) {
      return;
    }

    await this.repository.revokeRefreshToken(storedToken.id);
  }

  async revokeAllSessions(userId: number): Promise<void> {
    await this.repository.revokeAllUserRefreshTokens(userId);
  }

  async getCurrentUser(userId: number): Promise<AuthUser> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    return user;
  }

  async getCompany(companyId: number): Promise<CompanySummary | null> {
    return this.companies.findById(companyId);
  }

  private createAccessToken(user: AuthUser): string {
    const payload = buildAccessTokenPayload(user);

    return generateAccessToken(payload);
  }

  private getRefreshTokenExpiration(): Date {
    const durationMs = ms(env.JWT_REFRESH_EXPIRES_IN);

    if (typeof durationMs !== "number") {
      throw new Error(
        `Invalid JWT_REFRESH_EXPIRES_IN value: "${env.JWT_REFRESH_EXPIRES_IN}"`,
      );
    }

    return new Date(Date.now() + durationMs);
  }
}
