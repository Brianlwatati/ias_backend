// src/modules/transactions/transaction.service.ts

import { TransactionRepository } from "./transaction.repository.js";

import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { ConflictError } from "../../errors/ConflictError.js";

import type { CreateTransactionInput } from "./transaction.validation.js";
import type { Transaction } from "./transaction.types.js";
import type { Subscription } from "../subscriptions/subscription.types.js";

export interface SubscriptionLookup {
  findById(id: number): Promise<Subscription | null>;
}

export class TransactionService {
  constructor(
    private readonly repository: TransactionRepository,
    private readonly subscriptions: SubscriptionLookup,
  ) {}

  async createTransaction(
    companyId: number,
    input: CreateTransactionInput,
  ): Promise<Transaction> {
    let subscriptionId: number | null = null;

    if (input.subscriptionId !== undefined) {
      const subscription = await this.subscriptions.findById(
        input.subscriptionId,
      );

      if (!subscription) {
        throw new NotFoundError("Subscription not found");
      }

      /**
       * Tenant isolation, same rule as everywhere else: the
       * subscription being paid against must belong to the
       * company in the URL.
       */
      if (subscription.companyId !== companyId) {
        throw new BadRequestError(
          "This subscription does not belong to the specified company",
        );
      }

      subscriptionId = subscription.id;
    }

    const transactionReference = this.repository.generateReference();

    const id = await this.repository.create({
      companyId,
      subscriptionId,
      transactionReference,
      transactionType: input.transactionType,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod ?? null,
      externalTransactionId: input.externalTransactionId ?? null,
      notes: input.notes ?? null,
    });

    const transaction = await this.repository.findById(id);

    if (!transaction) {
      throw new Error("Failed to load transaction after creation");
    }

    return transaction;
  }

  async getById(id: number): Promise<Transaction> {
    const transaction = await this.repository.findById(id);

    if (!transaction) {
      throw new NotFoundError("Transaction not found");
    }

    if (transaction.subscriptionId !== null) {
      const subscription = await this.subscriptions.findById(
        transaction.subscriptionId,
      );

      return {
        ...transaction,
        subscription,
      };
    }

    return {
      ...transaction,
      subscription: null,
    };
  }

  async listByCompany(params: {
    companyId: number;
    status?: string;
    transactionType?: string;
    page: number;
    pageSize: number;
  }) {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    const { items, total } = await this.repository.listByCompany({
      companyId: params.companyId,
      ...(params.status !== undefined ? { status: params.status } : {}),
      ...(params.transactionType !== undefined
        ? { transactionType: params.transactionType }
        : {}),
      limit,
      offset,
    });

    return {
      items,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  async setStatus(
    id: number,
    status: Transaction["status"],
  ): Promise<Transaction> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Transaction not found");
    }

    if (existing.status === "SUCCESS" && status !== "REFUNDED") {
      /**
       * A SUCCESS transaction shouldn't be silently flipped to
       * PENDING/FAILED after the fact — that would misrepresent
       * financial history. The only valid forward transition
       * from SUCCESS is REFUNDED (a new state reflecting reality,
       * not an edit of what happened).
       */
      throw new ConflictError(
        "A successful transaction can only transition to REFUNDED",
      );
    }

    await this.repository.setStatus(id, status);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Transaction not found");
    }

    return updated;
  }
}
