// src/modules/company-products/company-product.repository.ts

import mysql from "mysql2/promise";

import { CompanyProduct } from "./company-product.types.js";

type DbConnection = mysql.Pool | mysql.PoolConnection;

export class CompanyProductRepository {
  constructor(private readonly db: mysql.Pool) {}

  async findById(
    id: number,
    connection: DbConnection = this.db,
  ): Promise<CompanyProduct | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, company_id AS companyId, company_name AS companyName,
            company_code AS companyCode, product_id AS productId,
            product_name AS productName, product_code AS productCode,
            status, granted_at AS grantedAt, revoked_at AS revokedAt,
            created_at AS createdAt, updated_at AS updatedAt
        FROM company_products
        WHERE id = ?
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
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, company_id AS companyId, company_name AS companyName,
            company_code AS companyCode, product_id AS productId,
            product_name AS productName, product_code AS productCode,
            status, granted_at AS grantedAt, revoked_at AS revokedAt,
            created_at AS createdAt, updated_at AS updatedAt
        FROM company_products
        WHERE company_id = ?
          AND product_id = ?
        LIMIT 1
        `,
      [companyId, productId],
    );

    return rows.length ? (rows[0] as CompanyProduct) : null;
  }

  async listByCompany(companyId: number): Promise<CompanyProduct[]> {
    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
            id, company_id AS companyId, company_name AS companyName,
            company_code AS companyCode, product_id AS productId,
            product_name AS productName, product_code AS productCode,
            status, granted_at AS grantedAt, revoked_at AS revokedAt,
            created_at AS createdAt, updated_at AS updatedAt
        FROM company_products
        WHERE company_id = ?
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
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `
        INSERT INTO company_products (
            company_id, company_name, company_code,
            product_id, product_name, product_code,
            status, granted_at, revoked_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NULL)
        ON DUPLICATE KEY UPDATE
            company_name = VALUES(company_name),
            company_code = VALUES(company_code),
            product_name = VALUES(product_name),
            product_code = VALUES(product_code),
            status = 'ACTIVE',
            granted_at = NOW(),
            revoked_at = NULL,
            id = LAST_INSERT_ID(id)
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

    return result.insertId;
  }

  async setStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
    revokedAt: Date | null,
  ): Promise<void> {
    await this.db.query(
      `
        UPDATE company_products
        SET status = ?, revoked_at = ?
        WHERE id = ?
        `,
      [status, revokedAt, id],
    );
  }
}
