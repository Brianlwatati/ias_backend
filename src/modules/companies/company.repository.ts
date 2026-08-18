// src/modules/companies/company.repository.ts

import type { Pool, PoolClient } from "pg";

import {
  Company,
  CompanyProduct,
  ProductRow,
  SystemRoleRow,
  CreateCompanyInput,
  UpdateCompanyInput,
  queryListCompaniesParams,
} from "./company.types.js";

type DbConnection = Pool | PoolClient;

export class CompanyRepository {
  constructor(private readonly db: Pool) {}

  async findByCode(
    code: string,
    connection: DbConnection = this.db,
  ): Promise<Company | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            id, name, code, email, phone, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM companies
        WHERE code = $1
        LIMIT 1
        `,
      [code],
    );

    return rows.length ? (rows[0] as Company) : null;
  }

  async findById(
    id: number,
    connection: DbConnection = this.db,
  ): Promise<Company | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            id, name, code, email, phone, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM companies
        WHERE id = $1
        LIMIT 1
        `,
      [id],
    );

    return rows.length ? (rows[0] as Company) : null;
  }

  async create(
    data: CreateCompanyInput,
    connection: DbConnection = this.db,
  ): Promise<number> {
    const {
      rows: [result],
    } = await connection.query<Record<string, any>>(
      `
        INSERT INTO companies (name, code, email, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
      [data.name, data.code, data.email, data.phone],
    );

    return result?.id as number;
  }

  async update(id: number, data: UpdateCompanyInput): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push(`email = $${values.length + 1}`);
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push(`phone = $${values.length + 1}`);
      values.push(data.phone);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    await this.db.query(
      `UPDATE companies SET ${fields.join(", ")} WHERE id = $${values.length + 1}`,
      values,
    );
  }

  async setStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<void> {
    await this.db.query(`UPDATE companies SET status = $1 WHERE id = $2`, [
      status,
      id,
    ]);
  }

  async list(
    params: queryListCompaniesParams,
  ): Promise<{ items: Company[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(params.status);
    }

    if (params.search) {
      conditions.push(
        `(name ILIKE $${values.length + 1} OR code ILIKE $${values.length + 2})`,
      );
      values.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, name, code, email, phone, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM companies
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
      [...values, params.limit, params.offset],
    );

    const { rows: countRows } = await this.db.query<Record<string, any>>(
      `SELECT COUNT(*) AS total FROM companies ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { items: rows as Company[], total };
  }

  async findSystemRoleByCode(
    code: string,
    connection: DbConnection = this.db,
  ): Promise<SystemRoleRow | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT id, code, scope
        FROM roles
        WHERE code = $1
          AND scope = 'SYSTEM'
          AND role_scope_key = 'SYSTEM'
        LIMIT 1
        `,
      [code],
    );

    return rows.length ? (rows[0] as SystemRoleRow) : null;
  }

  async createCompanyAdmin(
    data: {
      companyId: number;
      roleId: number;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
    },
    connection: DbConnection = this.db,
  ): Promise<number> {
    const { rows: roleRows } = await connection.query<Record<string, any>>(
      `
        SELECT name, code
        FROM roles
        WHERE id = $1
        LIMIT 1
        `,
      [data.roleId],
    );

    const roleName = roleRows[0]?.name ?? null;
    const roleCode = roleRows[0]?.code ?? null;

    const {
      rows: [result],
    } = await connection.query<Record<string, any>>(
      `
        INSERT INTO users (
            company_id, system_role_id, role_name, role_code,
            email, password_hash,
            first_name, last_name, status, email_verified_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', NULL)
        RETURNING id
        `,
      [
        data.companyId,
        data.roleId,
        roleName,
        roleCode,
        data.email,
        data.passwordHash,
        data.firstName,
        data.lastName,
      ],
    );

    return result?.id as number;
  }
}
