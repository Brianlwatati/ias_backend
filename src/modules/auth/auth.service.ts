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

    // Don't reveal whether the email exists.
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
}
