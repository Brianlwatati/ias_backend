// src/modules/products/product.repository.ts

import type { Pool, PoolClient } from "pg";

import { Product } from "./product.types.js";

export class ProductRepository {
  constructor(private readonly db: Pool) {}

  async findByCode(code: string): Promise<Product | null> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, name, code, description, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM products
        WHERE code = $1
        LIMIT 1
        `,
      [code],
    );

    return rows.length ? (rows[0] as Product) : null;
  }

  async findById(id: number): Promise<Product | null> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, name, code, description, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM products
        WHERE id = $1
        LIMIT 1
        `,
      [id],
    );

    return rows.length ? (rows[0] as Product) : null;
  }

  async create(data: {
    name: string;
    code: string;
    description: string | null;
  }): Promise<number> {
    const {
      rows: [result],
    } = await this.db.query<Record<string, any>>(
      `
        INSERT INTO products (name, code, description)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
      [data.name, data.code, data.description],
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
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${values.length + 1}`,
      values,
    );
  }

  async setStatus(id: number, status: "ACTIVE" | "INACTIVE"): Promise<void> {
    await this.db.query(`UPDATE products SET status = $1 WHERE id = $2`, [
      status,
      id,
    ]);
  }

  async list(params: {
    status?: string;
    search?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Product[]; total: number }> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.status && params.status.length > 0) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(params.status);
    }

    if (params.search && params.search.length > 0) {
      conditions.push(`(name ILIKE $${values.length + 1} OR code ILIKE $${values.length + 2})`);
      values.push(`%${params.search}%`, `%${params.search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, name, code, description, status,
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM products
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
      [...values, params.limit, params.offset],
    );

    const { rows: countRows } = await this.db.query<Record<string, any>>(
      `SELECT COUNT(*) AS total FROM products ${whereClause}`,
      values,
    );

    const total = Number(countRows[0]?.total ?? 0);

    return { items: rows as Product[], total };
  }

  /**
   * Count how many companies currently hold an ACTIVE
   * entitlement to this product. Used to warn/block
   * deactivation of a product that's in active use.
   */
  async countActiveCompanySubscriptions(productId: number): Promise<number> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT COUNT(*) AS total
        FROM company_products
        WHERE product_id = $1
          AND status = 'ACTIVE'
        `,
      [productId],
    );

    return Number(rows[0]?.total ?? 0);
  }
}
