import { verifyPassword } from "../../utils/password.js";

import { generateAccessToken } from "../../utils/jwt.js";

import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../utils/refresh-token.js";

import { addDays } from "../../utils/date.js";

import { AuthRepository } from "./auth.repository.js";

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login(email: string, password: string) {
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("Account is not active");
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      throw new Error("Invalid email or password");
    }

    await this.repository.updateLastLogin(user.id);

    const accessToken = generateAccessToken({
      sub: String(user.id),
      type: "access",
      role: user.roleCode ?? "UNKNOWN",
      companyId:
        user.companyId !== null && user.companyId !== undefined
          ? String(user.companyId)
          : null,
    });

    const refreshToken = generateRefreshToken();

    const refreshTokenHash = hashRefreshToken(refreshToken);

    const expiresAt = addDays(new Date(), 7);

    await this.repository.createRefreshToken(
      user.id,
      refreshTokenHash,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.roleCode,
        companyId: user.companyId,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const tokenHash = hashRefreshToken(refreshToken);

    /*
     * We need direct access to a pooled
     * connection because transactions cannot
     * safely span separate pool.query() calls.
     */
    const connection = await this.repository.getConnection();

    try {
      await connection.beginTransaction();

      const storedToken = await this.repository.findRefreshTokenForUpdate(
        tokenHash,
        connection,
      );

      if (!storedToken) {
        throw new Error("Invalid refresh token");
      }

      if (storedToken.revokedAt) {
        throw new Error("Refresh token has been revoked");
      }

      if (new Date(storedToken.expiresAt) <= new Date()) {
        throw new Error("Refresh token has expired");
      }

      const user = await this.repository.findUserById(
        storedToken.userId,
        connection,
      );

      if (!user) {
        throw new Error("User no longer exists");
      }

      if (user.status !== "ACTIVE") {
        throw new Error("Account is not active");
      }

      /*
       * Revoke the old token.
       */
      await this.repository.revokeRefreshToken(storedToken.id, connection);

      /*
       * Generate replacement token.
       */
      const newRefreshToken = generateRefreshToken();

      const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

      const newRefreshTokenExpiresAt = addDays(new Date(), 7);

      await this.repository.createRefreshToken(
        user.id,
        newRefreshTokenHash,
        newRefreshTokenExpiresAt,
        connection,
      );

      /*
       * Generate new access token.
       */
      const newAccessToken = generateAccessToken({
        sub: String(user.id),
        type: "access",
        role: user.roleCode ?? "UNKNOWN",
        companyId:
          user.companyId !== null && user.companyId !== undefined
            ? String(user.companyId)
            : null,
      });

      await connection.commit();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      await connection.rollback();

      throw error;
    } finally {
      connection.release();
    }
  }
}
