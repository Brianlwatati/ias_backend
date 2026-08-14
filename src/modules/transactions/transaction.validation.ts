// src/modules/transactions/transaction.validation.ts

import { z } from "zod";

const currencyCode = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

const decimalAmount = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal (max 2 places)");

export const createTransactionSchema = z.object({
  subscriptionId: z.coerce.number().int().positive().optional(),
  transactionType: z.enum(["PAYMENT", "REFUND", "CREDIT", "DEBIT", "ADJUSTMENT"]),
  amount: decimalAmount,
  currency: currencyCode,
  paymentMethod: z.string().trim().max(50).optional(),
  externalTransactionId: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateTransactionStatusSchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"]),
});

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const transactionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  transactionId: z.coerce.number().int().positive(),
});

export const listTransactionsQuerySchema = z.object({
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"]).optional(),
  transactionType: z
    .enum(["PAYMENT", "REFUND", "CREDIT", "DEBIT", "ADJUSTMENT"])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionStatusInput = z.infer<
  typeof updateTransactionStatusSchema
>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
