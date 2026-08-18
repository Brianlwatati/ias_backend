// src/modules/roles/role.repository.ts

import mysql from "mysql2/promise";

import { Role } from "./role.types.js";

export class RoleRepository {
  constructor(private readonly db: mysql.Pool) {}

  async findById(id: number): Promise<Role | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, product_id AS productId, name, code, scope,
            role_scope_key AS roleScopeKey, description, status,
            created_at AS createdAt, updated_at AS updatedAt
        FROM roles
        WHERE id = ?
        LIMIT 1
        `,
      [id],
    );

    return rows.length ? (rows[0] as Role) : null;
  }

  async findByProductAndCode(
    productId: number,
    code: string,
  ): Promise<Role | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, product_id AS productId, name, code, scope,
            role_scope_key AS roleScopeKey, description, status,
            created_at AS createdAt, updated_at AS updatedAt
        FROM roles
        WHERE product_id = ?
          AND code = ?
        LIMIT 1
        `,
      [productId, code],
    );

    return rows.length ? (rows[0] as Role) : null;
  }

  async create(data: {
    productId: number;
    name: string;
    code: string;
    productCode: string;
    description: string | null;
  }): Promise<number> {
    const roleScopeKey = `PRODUCT:${data.productCode}`;

    const [result] = await this.db.query<mysql.ResultSetHeader>(
      `
        INSERT INTO roles (
            product_id, name, code, scope, role_scope_key, description
        )
        VALUES (?, ?, ?, 'PRODUCT', ?, ?)
        `,
      [data.productId, data.name, data.code, roleScopeKey, data.description],
    );

    return result.insertId;
  }

  async update(
    id: number,
    data: Partial<{ name: string; description: string | null }>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    await this.db.query(
      `UPDATE roles SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );
  }

  async setStatus(id: number, status: "ACTIVE" | "INACTIVE"): Promise<void> {
    await this.db.query(`UPDATE roles SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
  }

  async list(params: {
    productId?: number;
    scope?: string;
    status?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Role[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.productId !== undefined) {
      conditions.push("product_id = ?");
      values.push(params.productId);
    }

    if (params.scope) {
      conditions.push("scope = ?");
      values.push(params.scope);
    }

    if (params.status) {
      conditions.push("status = ?");
      values.push(params.status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, product_id AS productId, name, code, scope,
            role_scope_key AS roleScopeKey, description, status,
            created_at AS createdAt, updated_at AS updatedAt
        FROM roles
        ${whereClause}
        ORDER BY product_id ASC, code ASC
        LIMIT ? OFFSET ?
        `,
      [...values, params.limit, params.offset],
    );

    const [countRows] = await this.db.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM roles ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { items: rows as Role[], total };
  }

  /**
   * Used by createRole to confirm the target product exists
   * and is active before a role can be attached to it.
   */
  async findProductById(
    productId: number,
  ): Promise<{ id: number; code: string; status: string } | null> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `SELECT id, code, status FROM products WHERE id = ? LIMIT 1`,
      [productId],
    );

    return rows.length
      ? (rows[0] as { id: number; code: string; status: string })
      : null;
  }

  /**
   * Count how many user_products rows currently reference this
   * role. Surfaced when deactivating a role, same spirit as the
   * product deactivation warning.
   */
  async countActiveAssignments(roleId: number): Promise<number> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT COUNT(*) AS total
        FROM user_products
        WHERE role_id = ?
          AND status = 'ACTIVE'
        `,
      [roleId],
    );

    return Number(rows[0]?.total ?? 0);
  }
}
