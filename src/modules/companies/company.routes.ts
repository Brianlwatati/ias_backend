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
  assignProductSchema,
  companyIdParamSchema,
} from "./company.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

import { createCompanyUserRouter } from "../users/user.routes.js";

export function createCompanyRouter(db: mysql.Pool): Router {
  const router = Router();

  const repository = new CompanyRepository(db);
  const service = new CompanyService(repository, db);
  const controller = new CompanyController(service);

  /**
   * Nested user-management routes have their own SUPER_ADMIN-or-
   * COMPANY_ADMIN(own company) auth chain — mounted BEFORE the
   * SUPER_ADMIN-only .use() below, so COMPANY_ADMIN can reach them.
   */
  router.use("/:id/users", createCompanyUserRouter(db));

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

  router.post(
    "/:id/products",
    validateParams(companyIdParamSchema),
    validateRequest(assignProductSchema),
    controller.assignProduct,
  );

  router.get(
    "/:id/products",
    validateParams(companyIdParamSchema),
    controller.listProducts,
  );

  return router;
}
