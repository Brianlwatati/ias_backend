import mysql from "mysql2/promise";

import { AuthRepository } from "./auth.repository.js";
import {
  comparePassword,
  hashRefreshToken,
  generateRefreshToken,
  generateAccessToken,
} from "./auth.utils.js";
import type { AccessTokenPayload } from "./auth.utils.js";

import { withTransaction } from "../../database/transaction.js";

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
     * Don't reveal whether the email
     * exists or not.
     */
    if (!user) {
      throw new Error("Invalid email or password");
    }

    /**
     * Only active accounts can log in.
     */
    if (user.status !== "ACTIVE") {
      throw new Error("Account is not active");
    }

    const passwordValid = await comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new Error("Invalid email or password");
    }

    /**
     * Generate short-lived access token.
     */
    const payload: AccessTokenPayload = {
      sub: String(user.id),
      ...(user.roleCode ? { role: user.roleCode } : {}),
      ...(user.companyId !== null ? { companyId: String(user.companyId) } : {}),
    };

    const accessToken = generateAccessToken(payload);

    /**
     * Generate long-lived refresh token.
     *
     * The raw token is returned to the client.
     * Only its hash is stored in MySQL.
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
     * Update last login.
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
   * Important:
   *
   * The old refresh token is revoked and
   * the new refresh token is created inside
   * the SAME transaction.
   *
   * This prevents the system from ending up
   * with a revoked old token and no replacement
   * token if something fails.
   */
  async refresh(input: RefreshInput): Promise<AuthResponse> {
    const tokenHash = hashRefreshToken(input.refreshToken);

    return withTransaction(this.db, async (connection) => {
      /**
       * Lock the refresh-token row.
       *
       * This protects against two concurrent
       * requests trying to rotate the same token.
       */
      const storedToken = await this.repository.findRefreshTokenForUpdate(
        tokenHash,
        connection,
      );

      if (!storedToken) {
        throw new Error("Invalid refresh token");
      }

      /**
       * A revoked token cannot be reused.
       */
      if (storedToken.revokedAt) {
        throw new Error("Refresh token has been revoked");
      }

      /**
       * Check token expiration.
       */
      if (new Date(storedToken.expiresAt).getTime() <= Date.now()) {
        throw new Error("Refresh token has expired");
      }

      /**
       * Load the user using the SAME
       * transaction connection.
       */
      const user = await this.repository.findUserById(
        storedToken.userId,
        connection,
      );

      if (!user) {
        throw new Error("User no longer exists");
      }

      /**
       * The account must still be active.
       */
      if (user.status !== "ACTIVE") {
        throw new Error("Account is not active");
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
       * Store the new refresh token using
       * the SAME transaction connection.
       */
      await this.repository.createRefreshToken(
        user.id,
        newRefreshTokenHash,
        newRefreshTokenExpiresAt,
        connection,
      );

      /**
       * Generate new access token.
       */
      const payload: AccessTokenPayload = {
        sub: String(user.id),
        ...(user.roleCode ? { role: user.roleCode } : {}),
        ...(user.companyId !== null
          ? { companyId: String(user.companyId) }
          : {}),
      };

      const accessToken = generateAccessToken(payload);

      /**
       * withTransaction() commits here
       * if everything succeeds.
       */
      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  /**
   * Revoke all refresh tokens belonging
   * to a user.
   *
   * Useful for:
   *
   * - Logout from all devices
   * - Password change
   * - Account suspension
   * - Security incident
   */
  async revokeAllSessions(userId: number): Promise<void> {
    await this.repository.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Calculate the refresh-token expiration.
   *
   * Currently configured for 7 days.
   *
   * We can move this into env.ts later:
   *
   * JWT_REFRESH_EXPIRES_IN=7d
   */
  private getRefreshTokenExpiration(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7);

    return expiresAt;
  }
}
