// src/modules/company-products/company-product.routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { CompanyProductController } from "./company-product.controller.js";
import { CompanyProductRepository } from "./company-product.repository.js";
import { CompanyProductService } from "./company-product.service.js";

import { CompanyRepository } from "../companies/company.repository.js";
import { ProductRepository } from "../products/product.repository.js";

import {
  grantCompanyProductSchema,
  updateCompanyProductStatusSchema,
  companyIdParamSchema,
  companyProductIdParamSchema,
} from "./company-product.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { authorizeCompanyAccess } from "../../middleware/authorizeCompanyAccess.js";

/**
 * Mounted at /companies/:id/company-products.
 * SUPER_ADMIN (any company) or COMPANY_ADMIN (own company) —
 * a company admin can view what they have, but only SUPER_ADMIN
 * can grant/revoke, since that's a purchasing/entitlement action.
 */
export function createCompanyProductRouter(db: mysql.Pool): Router {
  const router = Router({ mergeParams: true });

  const repository = new CompanyProductRepository(db);
  const companyRepository = new CompanyRepository(db);
  const productRepository = new ProductRepository(db);

  const service = new CompanyProductService(
    repository,
    companyRepository,
    productRepository,
    db,
  );

  const controller = new CompanyProductController(service);

  router.use(
    authenticate,
    authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]),
    validateParams(companyIdParamSchema),
    authorizeCompanyAccess,
  );

  router.get("/", controller.list);

  router.post(
    "/",
    authorize("SUPER_ADMIN"),
    validateRequest(grantCompanyProductSchema),
    controller.grant,
  );

  router.patch(
    "/:companyProductId/status",
    authorize("SUPER_ADMIN"),
    validateParams(companyProductIdParamSchema),
    validateRequest(updateCompanyProductStatusSchema),
    controller.updateStatus,
  );

  return router;
}
