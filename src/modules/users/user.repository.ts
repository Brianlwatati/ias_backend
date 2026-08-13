// src/modules/users/user.repository.ts

import mysql from "mysql2/promise";

import { CompanyUser } from "./user.types.js";

export class UserRepository {
  constructor(private readonly db: mysql.Pool) {}

  async findByEmail(email: string): Promise<{ id: number } | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    return rows.length ? (rows[0] as { id: number }) : null;
  }

  /**
   * Find a user, scoped to a company. Returns null if the user
   * doesn't exist OR belongs to a different company — callers
   * should treat both cases identically (404, not 403), to avoid
   * leaking whether a given user id exists in another tenant.
   */
  async findByIdAndCompany(
    userId: number,
    companyId: number,
  ): Promise<CompanyUser | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, company_id AS companyId, email,
            first_name AS firstName, last_name AS lastName,
            status, email_verified_at AS emailVerifiedAt,
            last_login_at AS lastLoginAt,
            created_at AS createdAt, updated_at AS updatedAt
        FROM users
        WHERE id = ?
          AND company_id = ?
        LIMIT 1
        `,
      [userId, companyId],
    );

    return rows.length ? (rows[0] as CompanyUser) : null;
  }

  async create(data: {
    companyId: number;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string | null;
  }): Promise<number> {
    const [result] = await this.db.query<mysql.ResultSetHeader>(
      `
        INSERT INTO users (
            company_id, system_role_id, email, password_hash,
            first_name, last_name, status, email_verified_at
        )
        VALUES (?, NULL, ?, ?, ?, ?, 'PENDING', NULL)
        `,
      [
        data.companyId,
        data.email,
        data.passwordHash,
        data.firstName,
        data.lastName,
      ],
    );

    return result.insertId;
  }

  async update(
    userId: number,
    companyId: number,
    data: Partial<{ firstName: string; lastName: string | null }>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.firstName !== undefined) {
      fields.push("first_name = ?");
      values.push(data.firstName);
    }

    if (data.lastName !== undefined) {
      fields.push("last_name = ?");
      values.push(data.lastName);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(userId, companyId);

    await this.db.query(
      `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
          AND company_id = ?
        `,
      values,
    );
  }

  async setStatus(
    userId: number,
    companyId: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<void> {
    await this.db.query(
      `
        UPDATE users
        SET status = ?
        WHERE id = ?
          AND company_id = ?
        `,
      [status, userId, companyId],
    );
  }

  async listByCompany(params: {
    companyId: number;
    status?: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: CompanyUser[]; total: number }> {
    const conditions: string[] = ["company_id = ?"];
    const values: unknown[] = [params.companyId];

    if (params.status) {
      conditions.push("status = ?");
      values.push(params.status);
    }

    if (params.search) {
      conditions.push(
        "(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)",
      );
      values.push(
        `%${params.search}%`,
        `%${params.search}%`,
        `%${params.search}%`,
      );
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, company_id AS companyId, email,
            first_name AS firstName, last_name AS lastName,
            status, email_verified_at AS emailVerifiedAt,
            last_login_at AS lastLoginAt,
            created_at AS createdAt, updated_at AS updatedAt
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        `,
      [...values, params.limit, params.offset],
    );

    const [countRows] = await this.db.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { items: rows as CompanyUser[], total };
  }
}
