// src/modules/companies/company.repository.ts

import mysql from "mysql2/promise";

import {
  Company,
  CompanyProduct,
  ProductRow,
  SystemRoleRow,
  CreateCompanyInput,
  UpdateCompanyInput,
  queryListCompaniesParams,
} from "./company.types.js";

type DbConnection = mysql.Pool | mysql.PoolConnection;

export class CompanyRepository {
  constructor(private readonly db: mysql.Pool) {}

  async findByCode(
    code: string,
    connection: DbConnection = this.db,
  ): Promise<Company | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, name, code, email, phone, status,
            created_at AS createdAt, updated_at AS updatedAt
        FROM companies
        WHERE code = ?
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
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, name, code, email, phone, status,
            created_at AS createdAt, updated_at AS updatedAt
        FROM companies
        WHERE id = ?
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
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `
        INSERT INTO companies (name, code, email, phone)
        VALUES (?, ?, ?, ?)
        `,
      [data.name, data.code, data.email, data.phone],
    );

    return result.insertId;
  }

  async update(id: number, data: UpdateCompanyInput): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push("email = ?");
      values.push(data.email);
    }

    if (data.phone !== undefined) {
      fields.push("phone = ?");
      values.push(data.phone);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    await this.db.query(
      `UPDATE companies SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  }

  async setStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<void> {
    await this.db.query(`UPDATE companies SET status = ? WHERE id = ?`, [
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
      conditions.push("status = ?");
      values.push(params.status);
    }

    if (params.search) {
      conditions.push("(name LIKE ? OR code LIKE ?)");
      values.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, name, code, email, phone, status,
            created_at AS createdAt, updated_at AS updatedAt
        FROM companies
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        `,
      [...values, params.limit, params.offset],
    );

    const [countRows] = await this.db.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM companies ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { items: rows as Company[], total };
  }

  async findProductByCode(
    code: string,
    connection: DbConnection = this.db,
  ): Promise<ProductRow | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, code, name, status FROM products WHERE code = ? LIMIT 1`,
      [code],
    );

    return rows.length ? (rows[0] as ProductRow) : null;
  }

  /**
   * Insert or reactivate a company's access to a product.
   *
   * Uses ON DUPLICATE KEY UPDATE against the (company_id, product_id)
   * unique key so that re-assigning a previously INACTIVE/EXPIRED
   * product reactivates it instead of failing.
   */
  async addCompanyProduct(
    companyId: number,
    productId: number,
    expiresAt: Date | null,
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `
        INSERT INTO company_products (
            company_id, product_id, status, purchased_at, expires_at
        )
        VALUES (?, ?, 'ACTIVE', NOW(), ?)
        ON DUPLICATE KEY UPDATE
            status = 'ACTIVE',
            expires_at = VALUES(expires_at),
            purchased_at = NOW()
        `,
      [companyId, productId, expiresAt],
    );
  }

  async listCompanyProducts(companyId: number): Promise<CompanyProduct[]> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            cp.id,
            cp.company_id AS companyId,
            cp.product_id AS productId,
            p.code AS productCode,
            p.name AS productName,
            cp.status,
            cp.purchased_at AS purchasedAt,
            cp.expires_at AS expiresAt
        FROM company_products cp
        JOIN products p ON p.id = cp.product_id
        WHERE cp.company_id = ?
        ORDER BY p.name ASC
        `,
      [companyId],
    );

    return rows as CompanyProduct[];
  }

  async findSystemRoleByCode(
    code: string,
    connection: DbConnection = this.db,
  ): Promise<SystemRoleRow | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT id, code, scope
        FROM roles
        WHERE code = ?
          AND scope = 'SYSTEM'
          AND role_scope_key = 'SYSTEM'
        LIMIT 1
        `,
      [code],
    );

    return rows.length ? (rows[0] as SystemRoleRow) : null;
  }

  async findUserByEmail(
    email: string,
    connection: DbConnection = this.db,
  ): Promise<{ id: number } | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email],
    );

    return rows.length ? (rows[0] as { id: number }) : null;
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
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `
        INSERT INTO users (
            company_id, system_role_id, email, password_hash,
            first_name, last_name, status, email_verified_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NULL)
        `,
      [
        data.companyId,
        data.roleId,
        data.email,
        data.passwordHash,
        data.firstName,
        data.lastName,
      ],
    );

    return result.insertId;
  }
}
