// src/modules/subscriptions/subscription.controller.ts

import type { Request, Response } from "express";

import { SubscriptionService } from "./subscription.service.js";
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionStatusInput,
  CancelSubscriptionInput,
  UpdatePaymentStatusInput,
  ListSubscriptionsQuery,
} from "./subscription.validation.js";

export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const input = req.body as CreateSubscriptionInput;

    const subscription = await this.service.createSubscription(
      companyId,
      input,
    );

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);

    const query = (req as Request & { validatedQuery: ListSubscriptionsQuery })
      .validatedQuery;

    const result = await this.service.listByCompany({
      companyId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Subscriptions retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);

    const subscription = await this.service.getById(subscriptionId);

    res.status(200).json({
      success: true,
      message: "Subscription retrieved successfully",
      data: subscription,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);
    const { status } = req.body as UpdateSubscriptionStatusInput;

    const subscription = await this.service.setStatus(subscriptionId, status);

    res.status(200).json({
      success: true,
      message: "Subscription status updated successfully",
      data: subscription,
    });
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);
    const { cancellationReason } = req.body as CancelSubscriptionInput;

    const subscription = await this.service.cancel(
      subscriptionId,
      cancellationReason ?? null,
    );

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription,
    });
  };

  updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
    const subscriptionId = Number(req.params.subscriptionId);
    const { paymentStatus } = req.body as UpdatePaymentStatusInput;

    const subscription = await this.service.setPaymentStatus(
      subscriptionId,
      paymentStatus,
    );

    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: subscription,
    });
  };
}
