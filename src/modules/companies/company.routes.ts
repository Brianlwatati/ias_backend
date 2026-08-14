// src/modules/companies/company.routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { CompanyController } from "./company.controller.js";
import { CompanyRepository } from "./company.repository.js";
import { CompanyService } from "./company.service.js";

import {
  createCompanySchema,
  updateCompanySchema,
  updateCompanyStatusSchema,
  companyIdParamSchema,
} from "./company.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import { createCompanyUserRouter } from "../users/user.routes.js";
import { createCompanyProductRouter } from "../company-products/company-product.routes.js";
import { createSubscriptionRouter } from "../subscriptions/subscription.routes.js";
import { createTransactionRouter } from "../transactions/transaction.routes.js";

/**
 * NOTE: this file replaces the earlier version of company.routes.ts.
 *
 * The `assignProduct` / `listProducts` endpoints that previously lived
 * directly on the companies module have been REMOVED — that
 * responsibility now belongs entirely to the company-products module
 * mounted below. If your company.service.ts / company.controller.ts
 * still contain assignProduct/listProducts methods, they can be
 * deleted; nothing references them anymore.
 */
export function createCompanyRouter(db: mysql.Pool): Router {
  const router = Router();

  const repository = new CompanyRepository(db);
  const service = new CompanyService(repository, db);
  const controller = new CompanyController(service);

  /**
   * Nested routers each carry their own auth chain
   * (SUPER_ADMIN or COMPANY_ADMIN-of-own-company) — mounted
   * BEFORE the blanket SUPER_ADMIN-only .use() below, so
   * COMPANY_ADMIN can reach them.
   */
  router.use("/:id/users", createCompanyUserRouter(db));
  router.use("/:id/companyproducts", createCompanyProductRouter(db));
  router.use("/:id/subscriptions", createSubscriptionRouter(db));
  router.use("/:id/transactions", createTransactionRouter(db));

  /**
   * Everything below this line is SUPER_ADMIN only.
   */
  router.use(authenticate, authorize("SUPER_ADMIN"));

  router.post("/", validateRequest(createCompanySchema), controller.create);

  router.get("/", controller.list);

  router.get("/:id", validateParams(companyIdParamSchema), controller.getById);

  router.patch(
    "/:id",
    validateParams(companyIdParamSchema),
    validateRequest(updateCompanySchema),
    controller.update,
  );

  router.patch(
    "/:id/status",
    validateParams(companyIdParamSchema),
    validateRequest(updateCompanyStatusSchema),
    controller.updateStatus,
  );

  return router;
}
