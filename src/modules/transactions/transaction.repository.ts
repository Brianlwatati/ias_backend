// src/modules/transactions/transaction.repository.ts

import type { Pool, PoolClient } from "pg";
import crypto from "node:crypto";

import { Transaction } from "./transaction.types.js";

type DbConnection = Pool | PoolClient;

const SELECT_FIELDS = `
    id, company_id AS "companyId", subscription_id AS "subscriptionId",
    transaction_reference AS "transactionReference",
    transaction_type AS "transactionType", amount, currency, status,
    payment_method AS "paymentMethod",
    external_transaction_id AS "externalTransactionId",
    transaction_date AS "transactionDate", notes,
    created_at AS "createdAt", updated_at AS "updatedAt"
`;

export class TransactionRepository {
  constructor(private readonly db: Pool) {}

  async findById(id: number): Promise<Transaction | null> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `SELECT ${SELECT_FIELDS} FROM transactions WHERE id = $1 LIMIT 1`,
      [id],
    );

    return rows.length ? (rows[0] as Transaction) : null;
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    const { rows: rows } = await this.db.query<Record<string, any>>(
      `SELECT ${SELECT_FIELDS} FROM transactions WHERE transaction_reference = $1 LIMIT 1`,
      [reference],
    );

    return rows.length ? (rows[0] as Transaction) : null;
  }

  /**
   * Generates a unique, human-scannable transaction reference.
   * Format: TXN-{timestamp base36}-{6 random hex chars}
   * Collisions are astronomically unlikely, but the UNIQUE KEY
   * on transaction_reference is the real backstop.
   */
  generateReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  async create(
    data: {
      companyId: number;
      subscriptionId: number | null;
      transactionReference: string;
      transactionType: Transaction["transactionType"];
      amount: string;
      currency: string;
      paymentMethod: string | null;
      externalTransactionId: string | null;
      notes: string | null;
    },
    connection: DbConnection = this.db,
  ): Promise<number> {
    const {
      rows: [result],
    } = await connection.query<Record<string, any>>(
      `
        INSERT INTO transactions (
            company_id, subscription_id, transaction_reference,
            transaction_type, amount, currency, status,
            payment_method, external_transaction_id, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9)
        RETURNING id
        `,
      [
        data.companyId,
        data.subscriptionId,
        data.transactionReference,
        data.transactionType,
        data.amount,
        data.currency,
        data.paymentMethod,
        data.externalTransactionId,
        data.notes,
      ],
    );

    return result?.id as number;
  }

  async setStatus(
    id: number,
    status: Transaction["status"],
    connection: DbConnection = this.db,
  ): Promise<void> {
    await connection.query(
      `UPDATE transactions SET status = $1 WHERE id = $2`,
      [status, id],
    );
  }

  async listByCompany(params: {
    companyId: number;
    status?: string;
    transactionType?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: Transaction[]; total: number }> {
    const conditions = [`company_id = $1`];
    const values: unknown[] = [params.companyId];

    if (params.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(params.status);
    }

    if (params.transactionType) {
      conditions.push(`transaction_type = $${values.length + 1}`);
      values.push(params.transactionType);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    const { rows: rows } = await this.db.query<Record<string, any>>(
      `
        SELECT ${SELECT_FIELDS}
        FROM transactions
        ${whereClause}
        ORDER BY transaction_date DESC
        LIMIT $${values.length + 1} OFFSET $${values.length + 2}
        `,
      [...values, params.limit, params.offset],
    );

    const { rows: countRows } = await this.db.query<Record<string, any>>(
      `SELECT COUNT(*) AS total FROM transactions ${whereClause}`,
      values,
    );

    return {
      items: rows as Transaction[],
      total: Number(countRows[0]?.total ?? 0),
    };
  }
}
