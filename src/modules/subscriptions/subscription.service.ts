// src/modules/subscriptions/subscription.service.ts

import type { Pool, PoolClient } from "pg";

import { SubscriptionRepository } from "./subscription.repository.js";
import { withTransaction } from "../../database/transaction.js";

import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";
import { ConflictError } from "../../errors/ConflictError.js";

import type { CreateSubscriptionInput } from "./subscription.validation.js";
import type { Subscription } from "./subscription.types.js";

export interface CompanyProductLookup {
  findById(id: number): Promise<{
    id: number;
    companyId: number;
    status: string;
  } | null>;
}

export class SubscriptionService {
  constructor(
    private readonly repository: SubscriptionRepository,
    private readonly companyProducts: CompanyProductLookup,
    private readonly db: Pool,
  ) {}

  async createSubscription(
    companyId: number,
    input: CreateSubscriptionInput,
  ): Promise<Subscription> {
    return withTransaction(this.db, async (connection) => {
      const companyProduct = await this.companyProducts.findById(
        input.companyProductId,
      );

      if (!companyProduct) {
        throw new NotFoundError("Company product not found");
      }

      /**
       * Tenant isolation: the company_product being subscribed
       * to must actually belong to the company in the URL. Same
       * "never trust it, verify it" rule applied everywhere else.
       */
      if (companyProduct.companyId !== companyId) {
        throw new BadRequestError(
          "This product grant does not belong to the specified company",
        );
      }

      if (companyProduct.status !== "ACTIVE") {
        throw new BadRequestError(
          "Cannot subscribe to a product that is not actively granted to this company",
        );
      }

      const startsAt = new Date(input.startsAt);
      const endsAt = new Date(input.endsAt);

      const overlapping = await this.repository.findOverlapping(
        input.companyProductId,
        startsAt,
        endsAt,
        connection,
      );

      if (overlapping) {
        throw new ConflictError(
          "An active or pending subscription already exists for this period",
        );
      }

      const id = await this.repository.create(
        {
          companyId,
          companyProductId: input.companyProductId,
          amount: input.amount,
          currency: input.currency,
          startsAt,
          endsAt,
          autoRenew: input.autoRenew,
        },
        connection,
      );

      const subscription = await this.repository.findById(id, connection);

      if (!subscription) {
        throw new Error("Failed to load subscription after creation");
      }

      return subscription;
    });
  }

  async getById(id: number): Promise<Subscription> {
    const subscription = await this.repository.findById(id);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    return subscription;
  }

  async listByCompany(params: {
    companyId: number;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    const { items, total } = await this.repository.listByCompany({
      companyId: params.companyId,
      ...(params.status !== undefined ? { status: params.status } : {}),
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
    status: Subscription["status"],
  ): Promise<Subscription> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Subscription not found");
    }

    await this.repository.setStatus(id, status);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Subscription not found");
    }

    return updated;
  }

  async cancel(id: number, reason: string | null): Promise<Subscription> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Subscription not found");
    }

    if (existing.status === "CANCELLED") {
      throw new ConflictError("Subscription is already cancelled");
    }

    await this.repository.cancel(id, reason);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Subscription not found");
    }

    return updated;
  }

  async setPaymentStatus(
    id: number,
    paymentStatus: Subscription["paymentStatus"],
  ): Promise<Subscription> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Subscription not found");
    }

    await this.repository.setPaymentStatus(id, paymentStatus);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Subscription not found");
    }

    return updated;
  }

  async setStatusAndPaymentStatus(
    id: number,
    status: Subscription["status"],
    paymentStatus: Subscription["paymentStatus"],
  ): Promise<Subscription> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Subscription not found");
    }

    await this.repository.setStatus(id, status);
    await this.repository.setPaymentStatus(id, paymentStatus);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Subscription not found");
    }

    return updated;
  }
}
