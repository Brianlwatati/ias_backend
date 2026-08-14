// src/modules/subscriptions/subscription.routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { SubscriptionController } from "./subscription.controller.js";
import { SubscriptionRepository } from "./subscription.repository.js";
import { SubscriptionService } from "./subscription.service.js";

import { CompanyProductRepository } from "../company-products/company-product.repository.js";

import {
  createSubscriptionSchema,
  updateSubscriptionStatusSchema,
  cancelSubscriptionSchema,
  updatePaymentStatusSchema,
  companyIdParamSchema,
  subscriptionIdParamSchema,
  listSubscriptionsQuerySchema,
} from "./subscription.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { validateQuery } from "../../middleware/validateQuery.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { authorizeCompanyAccess } from "../../middleware/authorizeCompanyAccess.js";

/**
 * Mounted at /companies/:id/subscriptions.
 * Billing operations — SUPER_ADMIN only for now (creating,
 * changing status, cancelling, marking paid). COMPANY_ADMIN
 * can view their own company's subscriptions.
 */
export function createSubscriptionRouter(db: mysql.Pool): Router {
  const router = Router({ mergeParams: true });

  const repository = new SubscriptionRepository(db);
  const companyProductRepository = new CompanyProductRepository(db);
  const service = new SubscriptionService(repository, companyProductRepository, db);
  const controller = new SubscriptionController(service);

  router.use(
    authenticate,
    authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]),
    validateParams(companyIdParamSchema),
    authorizeCompanyAccess,
  );

  router.get(
    "/",
    validateQuery(listSubscriptionsQuerySchema),
    controller.list,
  );

  router.get(
    "/:subscriptionId",
    validateParams(subscriptionIdParamSchema),
    controller.getById,
  );

  router.post(
    "/",
    authorize("SUPER_ADMIN"),
    validateRequest(createSubscriptionSchema),
    controller.create,
  );

  router.patch(
    "/:subscriptionId/status",
    authorize("SUPER_ADMIN"),
    validateParams(subscriptionIdParamSchema),
    validateRequest(updateSubscriptionStatusSchema),
    controller.updateStatus,
  );

  router.post(
    "/:subscriptionId/cancel",
    authorize("SUPER_ADMIN"),
    validateParams(subscriptionIdParamSchema),
    validateRequest(cancelSubscriptionSchema),
    controller.cancel,
  );

  router.patch(
    "/:subscriptionId/payment-status",
    authorize("SUPER_ADMIN"),
    validateParams(subscriptionIdParamSchema),
    validateRequest(updatePaymentStatusSchema),
    controller.updatePaymentStatus,
  );

  return router;
}
