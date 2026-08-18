// src/modules/subscriptions/subscription.repository.ts

import type { Pool, PoolClient } from "pg";

import { Subscription } from "./subscription.types.js";

type DbConnection = Pool | PoolClient;

const SELECT_FIELDS = `
    id, company_id AS "companyId", company_product_id AS "companyProductId",
    status, amount, currency,
    starts_at AS "startsAt", ends_at AS "endsAt",
    auto_renew AS "autoRenew", payment_status AS "paymentStatus",
    cancelled_at AS "cancelledAt", cancellation_reason AS "cancellationReason",
    created_at AS "createdAt", updated_at AS "updatedAt"
`;

export class SubscriptionRepository {
  constructor(private readonly db: Pool) {}

  async findById(
    id: number,
    connection: DbConnection = this.db,
  ): Promise<Subscription | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT
          s.id,
          s.company_product_id AS "companyProductId",
          s.company_id AS "companyId",
          cp.company_name AS "companyName",
          cp.company_code AS "companyCode",
          cp.product_id AS "productId",
          cp.product_name AS "productName",
          cp.product_code AS "productCode",
          s.status,
          s.amount,
          s.currency,
          s.starts_at AS "startsAt",
          s.ends_at AS "endsAt",
          s.auto_renew AS "autoRenew",
          s.payment_status AS "paymentStatus",
          s.cancelled_at AS "cancelledAt",
          s.cancellation_reason AS "cancellationReason",
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt"
        FROM subscriptions s
        LEFT JOIN company_products cp ON cp.id = s.company_product_id
        WHERE s.id = $1
        LIMIT 1
      `,
      [id],
    );

    return rows.length ? (rows[0] as Subscription) : null;
  }

  async create(
    data: {
      companyId: number;
      companyProductId: number;
      amount: string;
      currency: string;
      startsAt: Date;
      endsAt: Date;
      autoRenew: boolean;
    },
    connection: DbConnection = this.db,
  ): Promise<number> {
    const {
      rows: [result],
    } = await connection.query<Record<string, any>>(
      `
        INSERT INTO subscriptions (
            company_id, company_product_id, status, amount, currency,
            starts_at, ends_at, auto_renew, payment_status
        )
        VALUES ($1, $2, 'PENDING', $3, $4, $5, $6, $7, 'UNPAID')
        RETURNING id
        `,
      [
        data.companyId,
        data.companyProductId,
        data.amount,
        data.currency,
        data.startsAt,
        data.endsAt,
        data.autoRenew,
      ],
    );

    return result?.id as number;
  }

  async setStatus(
    id: number,
    status: Subscription["status"],
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `UPDATE subscriptions SET status = $1 WHERE id = $2`,
      [status, id],
    );
  }

  async cancel(
    id: number,
    reason: string | null,
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `
        UPDATE subscriptions
        SET status = 'CANCELLED', cancelled_at = NOW(), cancellation_reason = $1
        WHERE id = $2
        `,
      [reason, id],
    );
  }

  async setPaymentStatus(
    id: number,
    paymentStatus: Subscription["paymentStatus"],
  ): Promise<void> {
    await this.db.query(
      `UPDATE subscriptions SET payment_status = $1 WHERE id = $2`,
      [paymentStatus, id],
    );
  }

  async listByCompany(params: {
    companyId: number;
    status?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Subscription[]; total: number }> {
    const conditions = [`s.company_id = $1`];
    const values: unknown[] = [params.companyId];

    if (params.status) {
      conditions.push(`s.status = $${values.length + 1}`);
      values.push(params.status);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT
          s.id,
          s.company_product_id AS "companyProductId",
          s.company_id AS "companyId",
          cp.company_name AS "companyName",
          cp.company_code AS "companyCode",
          cp.product_id AS "productId",
          cp.product_name AS "productName",
          cp.product_code AS "productCode",
          s.status,
          s.amount,
          s.currency,
          s.starts_at AS "startsAt",
          s.ends_at AS "endsAt",
          s.auto_renew AS "autoRenew",
          s.payment_status AS "paymentStatus",
          s.cancelled_at AS "cancelledAt",
          s.cancellation_reason AS "cancellationReason",
          s.created_at AS "createdAt",
          s.updated_at AS "updatedAt"
        FROM subscriptions s
        LEFT JOIN company_products cp ON cp.id = s.company_product_id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
      [...values, params.limit, params.offset],
    );

    const { rows: countRows } = await this.db.query<Record<string, any>>(
      `SELECT COUNT(*) AS total
       FROM subscriptions s
       LEFT JOIN company_products cp ON cp.id = s.company_product_id
       ${whereClause}`,
      values,
    );

    return {
      items: rows as Subscription[],
      total: Number(countRows[0]?.total ?? 0),
    };
  }

  /**
   * Used to prevent overlapping ACTIVE/PENDING subscriptions on
   * the same company_product — see service layer for why.
   */
  async findOverlapping(
    companyProductId: number,
    startsAt: Date,
    endsAt: Date,
    connection: DbConnection = this.db,
  ): Promise<Subscription | null> {
    const { rows: rows } = await connection.query<Record<string, any>>(
      `
        SELECT ${SELECT_FIELDS}
        FROM subscriptions
        WHERE company_product_id = $1
          AND status IN ('PENDING', 'ACTIVE', 'PAST_DUE')
          AND starts_at < $2
          AND ends_at > $3
        LIMIT 1
        `,
      [companyProductId, endsAt, startsAt],
    );

    return rows.length ? (rows[0] as Subscription) : null;
  }
}
