// src/modules/transactions/transaction.routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { TransactionController } from "./transaction.controller.js";
import { TransactionRepository } from "./transaction.repository.js";
import { TransactionService } from "./transaction.service.js";

import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";

import {
  createTransactionSchema,
  updateTransactionStatusSchema,
  companyIdParamSchema,
  transactionIdParamSchema,
  listTransactionsQuerySchema,
} from "./transaction.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { validateQuery } from "../../middleware/validateQuery.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { authorizeCompanyAccess } from "../../middleware/authorizeCompanyAccess.js";

/**
 * Mounted at /companies/:id/transactions.
 * SUPER_ADMIN only for creating/mutating (financial record-keeping
 * is a platform-operator action). COMPANY_ADMIN can view their
 * own company's transaction history.
 */
export function createTransactionRouter(db: mysql.Pool): Router {
  const router = Router({ mergeParams: true });

  const repository = new TransactionRepository(db);
  const subscriptionRepository = new SubscriptionRepository(db);
  const service = new TransactionService(repository, subscriptionRepository);
  const controller = new TransactionController(service);

  router.use(
    authenticate,
    authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]),
    validateParams(companyIdParamSchema),
    authorizeCompanyAccess,
  );

  router.get(
    "/",
    validateQuery(listTransactionsQuerySchema),
    controller.list,
  );

  router.get(
    "/:transactionId",
    validateParams(transactionIdParamSchema),
    controller.getById,
  );

  router.post(
    "/",
    authorize("SUPER_ADMIN"),
    validateRequest(createTransactionSchema),
    controller.create,
  );

  router.patch(
    "/:transactionId/status",
    authorize("SUPER_ADMIN"),
    validateParams(transactionIdParamSchema),
    validateRequest(updateTransactionStatusSchema),
    controller.updateStatus,
  );

  return router;
}
