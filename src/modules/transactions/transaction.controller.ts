// src/modules/transactions/transaction.controller.ts

import type { Request, Response } from "express";

import { TransactionService } from "./transaction.service.js";
import type {
  CreateTransactionInput,
  UpdateTransactionStatusInput,
  ListTransactionsQuery,
} from "./transaction.validation.js";

export class TransactionController {
  constructor(private readonly service: TransactionService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const input = req.body as CreateTransactionInput;

    const transaction = await this.service.createTransaction(companyId, input);

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);

    const query = (req as Request & { validatedQuery: ListTransactionsQuery })
      .validatedQuery;

    const result = await this.service.listByCompany({
      companyId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.transactionType !== undefined
        ? { status: query.transactionType }
        : {}),
    });

    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const transactionId = Number(req.params.transactionId);

    const transaction = await this.service.getById(transactionId);

    res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      data: transaction,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const transactionId = Number(req.params.transactionId);
    const { status } = req.body as UpdateTransactionStatusInput;

    const transaction = await this.service.setStatus(transactionId, status);

    res.status(200).json({
      success: true,
      message: "Transaction status updated successfully",
      data: transaction,
    });
  };
}
