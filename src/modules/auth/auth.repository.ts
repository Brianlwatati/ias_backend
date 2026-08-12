import mysql from "mysql2/promise";

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
}

export interface RefreshTokenRecord {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export class AuthRepository {
  constructor(private readonly db: mysql.Pool) {}

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            u.id,
            u.email,
            u.password_hash AS passwordHash,
            u.first_name AS firstName,
            u.last_name AS lastName,
            u.status,
            u.company_id AS companyId,
            u.system_role_id AS roleId,
            r.code AS roleCode
        FROM users u

        LEFT JOIN roles r
            ON r.id = u.system_role_id

        WHERE u.email = ?
        LIMIT 1
        `,
      [email],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as AuthUser;
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.db.query(
      `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [userId],
    );
  }

  async createRefreshToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.query(
      `
      INSERT INTO refresh_tokens (
          user_id,
          token_hash,
          expires_at
      )
      VALUES (?, ?, ?)
      `,
      [userId, tokenHash, expiresAt],
    );
  }

  async findRefreshToken(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id,
            user_id AS userId,
            token_hash AS tokenHash,
            expires_at AS expiresAt,
            revoked_at AS revokedAt
        FROM refresh_tokens
        WHERE token_hash = ?
        LIMIT 1
        `,
      [tokenHash],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as RefreshTokenRecord;
  }

  async revokeRefreshToken(tokenId: number): Promise<void> {
    await this.db.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND revoked_at IS NULL
      `,
      [tokenId],
    );
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await this.db.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND revoked_at IS NULL
      `,
      [userId],
    );
  }
}
