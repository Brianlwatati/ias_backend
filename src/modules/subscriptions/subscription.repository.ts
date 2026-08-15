// src/modules/subscriptions/subscription.repository.ts

import mysql from "mysql2/promise";

import { Subscription } from "./subscription.types.js";

type DbConnection = mysql.Pool | mysql.PoolConnection;

const SELECT_FIELDS = `
    id, company_id AS companyId, company_product_id AS companyProductId,
    status, amount, currency,
    starts_at AS startsAt, ends_at AS endsAt,
    auto_renew AS autoRenew, payment_status AS paymentStatus,
    cancelled_at AS cancelledAt, cancellation_reason AS cancellationReason,
    created_at AS createdAt, updated_at AS updatedAt
`;

export class SubscriptionRepository {
  constructor(private readonly db: mysql.Pool) {}

  async findById(
    id: number,
    connection: DbConnection = this.db,
  ): Promise<Subscription | null> {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT
          s.id,
          s.company_product_id AS companyProductId,
          s.company_id AS companyId,
          cp.company_name AS companyName,
          cp.company_code AS companyCode,
          cp.product_id AS productId,
          cp.product_name AS productName,
          cp.product_code AS productCode,
          s.status,
          s.amount,
          s.currency,
          s.starts_at AS startsAt,
          s.ends_at AS endsAt,
          s.auto_renew AS autoRenew,
          s.payment_status AS paymentStatus,
          s.cancelled_at AS cancelledAt,
          s.cancellation_reason AS cancellationReason,
          s.created_at AS createdAt,
          s.updated_at AS updatedAt
        FROM subscriptions s
        LEFT JOIN company_products cp ON cp.id = s.company_product_id
        WHERE s.id = ?
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
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `
        INSERT INTO subscriptions (
            company_id, company_product_id, status, amount, currency,
            starts_at, ends_at, auto_renew, payment_status
        )
        VALUES (?, ?, 'PENDING', ?, ?, ?, ?, ?, 'UNPAID')
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

    return result.insertId;
  }

  async setStatus(
    id: number,
    status: Subscription["status"],
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(`UPDATE subscriptions SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
  }

  async cancel(
    id: number,
    reason: string | null,
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `
        UPDATE subscriptions
        SET status = 'CANCELLED', cancelled_at = NOW(), cancellation_reason = ?
        WHERE id = ?
        `,
      [reason, id],
    );
  }

  async setPaymentStatus(
    id: number,
    paymentStatus: Subscription["paymentStatus"],
  ): Promise<void> {
    await this.db.query(
      `UPDATE subscriptions SET payment_status = ? WHERE id = ?`,
      [paymentStatus, id],
    );
  }

  async listByCompany(params: {
    companyId: number;
    status?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Subscription[]; total: number }> {
    const conditions = ["s.company_id = ?"];
    const values: unknown[] = [params.companyId];

    if (params.status) {
      conditions.push("s.status = ?");
      values.push(params.status);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await this.db.query<mysql.RowDataPacket[]>(
      `
        SELECT
          s.id,
          s.company_product_id AS companyProductId,
          s.company_id AS companyId,
          cp.company_name AS companyName,
          cp.company_code AS companyCode,
          cp.product_id AS productId,
          cp.product_name AS productName,
          cp.product_code AS productCode,
          s.status,
          s.amount,
          s.currency,
          s.starts_at AS startsAt,
          s.ends_at AS endsAt,
          s.auto_renew AS autoRenew,
          s.payment_status AS paymentStatus,
          s.cancelled_at AS cancelledAt,
          s.cancellation_reason AS cancellationReason,
          s.created_at AS createdAt,
          s.updated_at AS updatedAt
        FROM subscriptions s
        LEFT JOIN company_products cp ON cp.id = s.company_product_id
        ${whereClause}
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
        `,
      [...values, params.limit, params.offset],
    );

    const [countRows] = await this.db.query<mysql.RowDataPacket[]>(
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
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT ${SELECT_FIELDS}
        FROM subscriptions
        WHERE company_product_id = ?
          AND status IN ('PENDING', 'ACTIVE', 'PAST_DUE')
          AND starts_at < ?
          AND ends_at > ?
        LIMIT 1
        `,
      [companyProductId, endsAt, startsAt],
    );

    return rows.length ? (rows[0] as Subscription) : null;
  }
}
