// src/modules/products/product.routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { ProductController } from "./product.controller.js";
import { ProductRepository } from "./product.repository.js";
import { ProductService } from "./product.service.js";

import {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  productIdParamSchema,
  listProductsQuerySchema,
} from "./product.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { validateQuery } from "../../middleware/validateQuery.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export function createProductRouter(db: mysql.Pool): Router {
  const router = Router();

  const repository = new ProductRepository(db);
  const service = new ProductService(repository);
  const controller = new ProductController(service);

  /**
   * Product catalog management is SUPER_ADMIN only —
   * only the platform owner registers new products.
   *
   * GET routes are deliberately left open to any
   * authenticated user (see below) since Company Admins
   * will eventually need to browse available products
   * when deciding what to request/purchase.
   */
  router.get(
    "/",
    authenticate,
    validateQuery(listProductsQuerySchema),
    controller.list,
  );

  router.get(
    "/:id",
    authenticate,
    validateParams(productIdParamSchema),
    controller.getById,
  );

  router.post(
    "/",
    authenticate,
    authorize("SUPER_ADMIN"),
    validateRequest(createProductSchema),
    controller.create,
  );

  router.patch(
    "/:id",
    authenticate,
    authorize("SUPER_ADMIN"),
    validateParams(productIdParamSchema),
    validateRequest(updateProductSchema),
    controller.update,
  );

  router.patch(
    "/:id/status",
    authenticate,
    authorize("SUPER_ADMIN"),
    validateParams(productIdParamSchema),
    validateRequest(updateProductStatusSchema),
    controller.updateStatus,
  );

  return router;
}
