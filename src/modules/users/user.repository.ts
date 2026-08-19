// src/modules/users/user.repository.ts

import type { Pool, PoolClient } from "pg";

import { CompanyUser } from "./user.types.js";

export class UserRepository {
  constructor(private readonly db: Pool) {}

  async findByEmail(email: string): Promise<{ id: number } | null> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
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
    const { rows } = await this.db.query<Record<string, any>>(
      `
      SELECT
        id as "userId", 
        company_id AS "companyId", 
        email, 
        phone,
        system_role_id AS "systemRoleId",
        role_name AS "roleName",
        role_code AS "roleCode",
        first_name AS "firstName", 
        last_name AS "lastName",
        status, 
        email_verified_at AS "emailVerifiedAt",
        last_login_at AS "lastLoginAt",
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
    `,
      [userId, companyId],
    );

    return rows.length ? (rows[0] as CompanyUser) : null;
  }

  async create(data: {
    companyId: number;
    email: string;
    phone?: string | null;
    passwordHash: string;
    firstName: string;
    lastName: string | null;
    systemRoleId: number;
  }): Promise<number> {
    const { rows: roleRow } = await this.db.query<Record<string, any>>(
      `
        SELECT name, code, scope, role_scope_key
        FROM roles
        WHERE id = $1
        LIMIT 1
        `,
      [data.systemRoleId],
    );

    const roleName = roleRow[0]?.name ?? null;
    const roleCode = roleRow[0]?.code ?? null;
    const roleScope = roleRow[0]?.scope ?? null;
    const roleScopeKey = roleRow[0]?.role_scope_key ?? null;

    const {
      rows: [result],
    } = await this.db.query<Record<string, any>>(
      `
        INSERT INTO users (
            company_id, system_role_id, role_name, role_code, role_scope, role_scope_key,
            email, phone, password_hash,
            first_name, last_name, status, email_verified_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', NULL)
        RETURNING id
        `,
      [
        data.companyId,
        data.systemRoleId,
        roleName,
        roleCode,
        roleScope,
        roleScopeKey,
        data.email,
        data.phone ?? null,
        data.passwordHash,
        data.firstName,
        data.lastName,
      ],
    );

    return result?.id as number;
  }

  async update(
    userId: number,
    companyId: number,
    data: Partial<{
      firstName: string;
      lastName: string | null;
      phone: string | null;
    }>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${values.length + 1}`);
      values.push(data.firstName);
    }

    if (data.lastName !== undefined) {
      fields.push(`last_name = $${values.length + 1}`);
      values.push(data.lastName);
    }

    if (data.phone !== undefined) {
      fields.push(`phone = $${values.length + 1}`);
      values.push(data.phone);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(userId, companyId);

    await this.db.query(
      `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = $${values.length + 1}
          AND company_id = $${values.length + 2}
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
        SET status = $1
        WHERE id = $2
          AND company_id = $3
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
    const conditions: string[] = [`u.company_id = $1`];
    const values: unknown[] = [params.companyId];

    if (params.status) {
      conditions.push(`u.status = $${values.length + 1}`);
      values.push(params.status);
    }

    if (params.search) {
      const searchTerm = `%${params.search}%`;
      conditions.push(
        `(u.email ILIKE $${values.length + 1} OR u.phone ILIKE $${values.length + 1} OR u.first_name ILIKE $${values.length + 1} OR u.last_name ILIKE $${values.length + 1})`,
      );
      values.push(searchTerm);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // Placeholders for LIMIT and OFFSET
    const limitIdx = values.length + 1;
    const offsetIdx = values.length + 2;

    const { rows } = await this.db.query<Record<string, any>>(
      `
      SELECT
        u.id as "userId",
        u.company_id AS "companyId",
        u.email,
        u.phone,
        u.system_role_id AS "systemRoleId",
        u.role_name AS "roleName",
        u.role_code AS "roleCode",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.status,
        u.email_verified_at AS "emailVerifiedAt",
        u.last_login_at AS "lastLoginAt",
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `,
      [...values, params.limit, params.offset],
    );

    const { rows: countRows } = await this.db.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM users u ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { items: rows as CompanyUser[], total };
  }
}
