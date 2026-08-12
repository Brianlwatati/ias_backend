import mysql from "mysql2/promise";

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

import { withTransaction } from "../../database/transaction.js";

import { UnauthorizedError } from "../../errors/UnauthorizedError.js";
import { ForbiddenError } from "../../errors/ForbiddenError.js";

import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RefreshInput,
} from "./auth.types.js";

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly db: mysql.Pool,
  ) {}

  /**
   * Authenticate a user.
   *
   * Flow:
   *
   * 1. Find user
   * 2. Check account status
   * 3. Verify password
   * 4. Generate access token
   * 5. Generate refresh token
   * 6. Store hashed refresh token
   * 7. Update last login
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();

    const user = await this.repository.findUserByEmail(email);

    /**
     * Do not reveal whether the email exists.
     */
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    /**
     * Only active accounts can authenticate.
     */
    if (user.status !== "ACTIVE") {
      throw new ForbiddenError("Account is not active");
    }

    const passwordValid = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = this.createAccessToken(user);

    /**
     * Generate a cryptographically secure
     * refresh token.
     *
     * Only the hash is stored in MySQL.
     */
    const refreshToken = generateRefreshToken();

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const refreshTokenExpiresAt = this.getRefreshTokenExpiration();

    await this.repository.createRefreshToken(
      user.id,
      refreshTokenHash,
      refreshTokenExpiresAt,
    );

    /**
     * Update user's last login timestamp.
     */
    await this.repository.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Rotate a refresh token.
   *
   * The old token is revoked and a new token
   * is created inside the same transaction.
   */
  async refresh(input: RefreshInput): Promise<AuthResponse> {
    const tokenHash = hashRefreshToken(input.refreshToken);

    return withTransaction(this.db, async (connection) => {
      /**
       * Lock the refresh-token row.
       *
       * This prevents concurrent requests from
       * successfully rotating the same token.
       */
      const storedToken = await this.repository.findRefreshTokenForUpdate(
        tokenHash,
        connection,
      );

      if (!storedToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      /**
       * A revoked token cannot be reused.
       */
      if (storedToken.revokedAt) {
        throw new UnauthorizedError("Refresh token has been revoked");
      }

      /**
       * Check expiration.
       */
      if (new Date(storedToken.expiresAt).getTime() <= Date.now()) {
        throw new UnauthorizedError("Refresh token has expired");
      }

      /**
       * Load the user using the SAME
       * database connection/transaction.
       */
      const user = await this.repository.findUserById(
        storedToken.userId,
        connection,
      );

      if (!user) {
        throw new UnauthorizedError("User no longer exists");
      }

      /**
       * The account must still be active.
       */
      if (user.status !== "ACTIVE") {
        throw new ForbiddenError("Account is not active");
      }

      /**
       * Revoke the old refresh token.
       */
      await this.repository.revokeRefreshToken(storedToken.id, connection);

      /**
       * Generate replacement refresh token.
       */
      const newRefreshToken = generateRefreshToken();

      const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

      const newRefreshTokenExpiresAt = this.getRefreshTokenExpiration();

      /**
       * Store the new refresh token in the
       * SAME transaction.
       */
      await this.repository.createRefreshToken(
        user.id,
        newRefreshTokenHash,
        newRefreshTokenExpiresAt,
        connection,
      );

      /**
       * Generate a new access token.
       */
      const accessToken = this.createAccessToken(user);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  /**
   * Logout from the current session.
   *
   * Revokes the supplied refresh token.
   *
   * This operation is intentionally idempotent:
   * - token doesn't exist -> nothing happens
   * - token already revoked -> nothing happens
   * - token exists -> revoke it
   */
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

  /**
   * Logout from all sessions.
   *
   * Revokes every refresh token belonging
   * to the specified user.
   */
  async revokeAllSessions(userId: number): Promise<void> {
    await this.repository.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Get the currently authenticated user.
   *
   * Used by:
   *
   * GET /auth/me
   */
  async getCurrentUser(userId: number): Promise<AuthUser> {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    return user;
  }

  /**
   * Build and generate an access token
   * for a user.
   */
  private createAccessToken(user: AuthUser): string {
    const payload = buildAccessTokenPayload(user);

    return generateAccessToken(payload);
  }

  /**
   * Calculate refresh-token expiration.
   *
   * Currently: 7 days.
   *
   * Later this can come from env:
   *
   * JWT_REFRESH_EXPIRES_IN=7d
   */
  private getRefreshTokenExpiration(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7);

    return expiresAt;
  }
}
