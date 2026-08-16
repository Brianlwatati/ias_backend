// src/modules/subscriptions/subscription.validation.ts

import { z } from "zod";

const currencyCode = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

const decimalAmount = z
  .string()
  .regex(
    /^\d+(\.\d{1,2})?$/,
    "Amount must be a positive decimal (max 2 places)",
  );

export const createSubscriptionSchema = z
  .object({
    companyProductId: z.coerce.number().int().positive(),
    amount: decimalAmount,
    currency: currencyCode,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    autoRenew: z.boolean().default(false),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACTIVE",
    "PAST_DUE",
    "SUSPENDED",
    "CANCELLED",
    "EXPIRED",
  ]),
});

export const cancelSubscriptionSchema = z.object({
  cancellationReason: z.string().trim().min(1).max(255).optional(),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERPAID"]),
});

export const updateStatusAndPaymentStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "ACTIVE",
    "PAST_DUE",
    "SUSPENDED",
    "CANCELLED",
    "EXPIRED",
  ]),
  paymentStatus: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERPAID"]),
});

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const subscriptionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  subscriptionId: z.coerce.number().int().positive(),
});

export const listSubscriptionsQuerySchema = z.object({
  status: z
    .enum([
      "PENDING",
      "ACTIVE",
      "PAST_DUE",
      "SUSPENDED",
      "CANCELLED",
      "EXPIRED",
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionStatusInput = z.infer<
  typeof updateSubscriptionStatusSchema
>;

export type StatusAndPaymentStatusInput = z.infer<
  typeof updateStatusAndPaymentStatusSchema
>;

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;
export type ListSubscriptionsQuery = z.infer<
  typeof listSubscriptionsQuerySchema
>;
