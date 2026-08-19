// src/modules/auth/auth.repository.ts

import type { Pool, PoolClient } from "pg";
import { AuthUser, RefreshTokenRecord } from "./auth.types.js";

/**
 * A repository operation can use either:
 *
 * - the normal PostgreSQL connection pool
 * - a connection that is currently inside a transaction
 */
type DbConnection = Pool | PoolClient;

export class AuthRepository {
  constructor(private readonly db: Pool) {}

  /**
   * Find a user by email.
   * Used during login.
   */
  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const { rows } = await this.db.query<Record<string, any>>(
      `
      SELECT
        u.id as "userId",
        u.email,
        u.password_hash AS "passwordHash",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.status,
        u.company_id AS "companyId",
        u.system_role_id AS "roleId",
        u.role_name AS "roleName",
        u.role_code AS "roleCode",
        u.role_scope AS "roleScope",
        u.role_scope_key AS "roleScopeKey"
      FROM users u
      WHERE u.email = $1
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
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            u.id as "userId",
            u.email,
            u.password_hash AS "passwordHash",
            u.first_name AS "firstName",
            u.last_name AS "lastName",
            u.status,
            u.company_id AS "companyId",
            u.system_role_id AS "roleId",
            u.role_name AS "roleName",
            u.role_code AS "roleCode",
            u.role_scope AS "roleScope",
            u.role_scope_key AS "roleScopeKey"
        FROM users u
        WHERE u.id = $1
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
      WHERE id = $1
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
      VALUES ($1, $2, $3)
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
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            id,
            user_id AS "userId",
            token_hash AS "tokenHash",
            expires_at AS "expiresAt",
            revoked_at AS "revokedAt"
        FROM refresh_tokens
        WHERE token_hash = $1
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
   * PoolClient inside a transaction.
   */
  async findRefreshTokenForUpdate(
    tokenHash: string,
    connection: PoolClient,
  ): Promise<RefreshTokenRecord | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            id,
            user_id AS "userId",
            token_hash AS "tokenHash",
            expires_at AS "expiresAt",
            revoked_at AS "revokedAt"
        FROM refresh_tokens
        WHERE token_hash = $1
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
      WHERE id = $1
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
      WHERE user_id = $1
        AND revoked_at IS NULL
      `,
      [userId],
    );
  }
}
