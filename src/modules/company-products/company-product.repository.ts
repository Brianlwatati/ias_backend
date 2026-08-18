// src/modules/company-products/company-product.repository.ts

import type { Pool, PoolClient } from "pg";

import { CompanyProduct } from "./company-product.types.js";

type DbConnection = Pool | PoolClient;

export class CompanyProductRepository {
  constructor(private readonly db: Pool) {}

  async findById(
    id: number,
    connection: DbConnection = this.db,
  ): Promise<CompanyProduct | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            id, company_id AS "companyId", company_name AS "companyName",
            company_code AS "companyCode", product_id AS "productId",
            product_name AS "productName", product_code AS "productCode",
            status, granted_at AS "grantedAt", revoked_at AS "revokedAt",
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM company_products
        WHERE id = $1
        LIMIT 1
        `,
      [id],
    );

    return rows.length ? (rows[0] as CompanyProduct) : null;
  }

  async findByCompanyAndProduct(
    companyId: number,
    productId: number,
    connection: DbConnection = this.db,
  ): Promise<CompanyProduct | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
            id, company_id AS "companyId", company_name AS "companyName",
            company_code AS "companyCode", product_id AS "productId",
            product_name AS "productName", product_code AS "productCode",
            status, granted_at AS "grantedAt", revoked_at AS "revokedAt",
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM company_products
        WHERE company_id = $1
          AND product_id = $2
        LIMIT 1
        `,
      [companyId, productId],
    );

    return rows.length ? (rows[0] as CompanyProduct) : null;
  }

  async listByCompany(companyId: number): Promise<CompanyProduct[]> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
            id, company_id AS "companyId", company_name AS "companyName",
            company_code AS "companyCode", product_id AS "productId",
            product_name AS "productName", product_code AS "productCode",
            status, granted_at AS "grantedAt", revoked_at AS "revokedAt",
            created_at AS "createdAt", updated_at AS "updatedAt"
        FROM company_products
        WHERE company_id = $1
        ORDER BY product_name ASC
        `,
      [companyId],
    );

    return rows as CompanyProduct[];
  }

  /**
   * Creates a new grant, snapshotting company/product name+code
   * at grant time. If a row already exists for this (company,
   * product) pair (e.g. previously revoked), reactivates it
   * instead — the UNIQUE KEY makes this pair a natural upsert
   * target.
   */
  async grant(
    data: {
      companyId: number;
      companyName: string;
      companyCode: string;
      productId: number;
      productName: string;
      productCode: string;
    },
    connection: DbConnection = this.db,
  ): Promise<number> {
    const {
      rows: [result],
    } = await connection.query<Record<string, any>>(
      `
        INSERT INTO company_products (
            company_id, company_name, company_code,
            product_id, product_name, product_code,
            status, granted_at, revoked_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', NOW(), NULL)
        ON CONFLICT (company_id, product_id) DO UPDATE
        SET company_name = EXCLUDED.company_name,
            company_code = EXCLUDED.company_code,
            product_name = EXCLUDED.product_name,
            product_code = EXCLUDED.product_code,
            status = 'ACTIVE',
            granted_at = CURRENT_TIMESTAMP,
            revoked_at = NULL
        RETURNING id
        `,
      [
        data.companyId,
        data.companyName,
        data.companyCode,
        data.productId,
        data.productName,
        data.productCode,
      ],
    );

    return result?.id as number;
  }

  async setStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
    revokedAt: Date | null,
  ): Promise<void> {
    await this.db.query(
      `
        UPDATE company_products
        SET status = $1, revoked_at = $2
        WHERE id = $3
        `,
      [status, revokedAt, id],
    );
  }
}
