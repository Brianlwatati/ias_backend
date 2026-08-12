import mysql from "mysql2/promise";
import { AuthUser, RefreshTokenRecord } from "./auth.types";

/**
 * A repository operation can use either:
 *
 * - the normal MySQL connection pool
 * - a connection that is currently inside a transaction
 */
type DbConnection = mysql.Pool | mysql.PoolConnection;

export class AuthRepository {
  constructor(private readonly db: mysql.Pool) {}

  /**
   * Find a user by email.
   * Used during login.
   */
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

  /**
   * Find a user by ID.
   *
   * The connection parameter allows this query
   * to participate in an existing transaction.
   */
  async findUserById(
    userId: number,
    connection: DbConnection = this.db,
  ): Promise<AuthUser | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
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
        WHERE u.id = ?
        LIMIT 1
        `,
      [userId],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as AuthUser;
  }

  /**
   * Update the user's last login timestamp.
   */
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

  /**
   * Create a refresh token.
   *
   * Normally uses the connection pool.
   * During refresh-token rotation, a transaction
   * connection is passed in.
   */
  async createRefreshToken(
    userId: number,
    tokenHash: string,
    expiresAt: Date,
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
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

  /**
   * Find a refresh token.
   *
   * This method can be used for normal lookups
   * where row locking is not required.
   */
  async findRefreshToken(
    tokenHash: string,
    connection: DbConnection = this.db,
  ): Promise<RefreshTokenRecord | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
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

  /**
   * Find and lock a refresh token.
   *
   * FOR UPDATE ensures that two concurrent
   * refresh requests cannot rotate the same
   * token at the same time.
   *
   * IMPORTANT:
   * This method MUST be called using a
   * mysql.PoolConnection inside a transaction.
   */
  async findRefreshTokenForUpdate(
    tokenHash: string,
    connection: mysql.PoolConnection,
  ): Promise<RefreshTokenRecord | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
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
        FOR UPDATE
        `,
      [tokenHash],
    );

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as RefreshTokenRecord;
  }

  /**
   * Revoke a specific refresh token.
   *
   * During token rotation this should use
   * the transaction connection.
   */
  async revokeRefreshToken(
    tokenId: number,
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND revoked_at IS NULL
      `,
      [tokenId],
    );
  }

  /**
   * Revoke all active refresh tokens for a user.
   *
   * Useful for:
   *
   * - Logout from all devices
   * - Password change
   * - Security incident
   * - Account suspension
   */
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
