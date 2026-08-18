// src/modules/roles/role.repository.ts

import type { Pool, PoolClient } from "pg";

import { Role } from "./role.types.js";

export class RoleRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: number): Promise<Role | null> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, product_id AS "productId", name, code, scope,
            role_scope_key AS "roleScopeKey", description, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM roles
        WHERE id = $1
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
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, product_id AS "productId", name, code, scope,
            role_scope_key AS "roleScopeKey", description, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM roles
        WHERE product_id = $1
          AND code = $2
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

    const {
      rows: [result],
    } = await this.db.query<Record<string, any>>(
      `
        INSERT INTO roles (
            product_id, name, code, scope, role_scope_key, description
        )
        VALUES ($1, $2, $3, 'PRODUCT', $4, $5)
        RETURNING id
        `,
      [data.productId, data.name, data.code, roleScopeKey, data.description],
    );

    return result?.id as number;
  }

  async update(
    id: number,
    data: Partial<{ name: string; description: string | null }>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push(`name = $${values.length + 1}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      fields.push(`description = $${values.length + 1}`);
      values.push(data.description);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(id);

    await this.db.query(
      `UPDATE roles SET ${fields.join(", ")} WHERE id = $${values.length + 1}`,
      values,
    );
  }

  async setStatus(id: number, status: "ACTIVE" | "INACTIVE"): Promise<void> {
    await this.db.query(`UPDATE roles SET status = $1 WHERE id = $2`, [
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
      conditions.push(`product_id = $${values.length + 1}`);
      values.push(params.productId);
    }

    if (params.scope) {
      conditions.push(`scope = $${values.length + 1}`);
      values.push(params.scope);
    }

    if (params.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(params.status);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, product_id AS "productId", name, code, scope,
            role_scope_key AS "roleScopeKey", description, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM roles
        ${whereClause}
        ORDER BY product_id ASC, code ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
      [...values, params.limit, params.offset],
    );

    const { rows: countRows } = await this.db.query<Record<string, any>>(
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
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `SELECT id, code, status FROM products WHERE id = $1 LIMIT 1`,
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
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT COUNT(*) AS total
        FROM user_products
        WHERE role_id = $1
          AND status = 'ACTIVE'
        `,
      [roleId],
    );

    return Number(rows[0]?.total ?? 0);
  }
}
