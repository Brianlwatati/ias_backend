// src/routes/routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createCompanyRouter } from "../modules/companies/company.routes.js";
import { createProductRouter } from "../modules/products/product.routes.js";
import { createRoleRouter } from "../modules/roles/role.routes.js";

export function createRoutes(db: mysql.Pool): Router {
  const router = Router();

  router.use("/auth", createAuthRouter(db));
  router.use("/companies", createCompanyRouter(db));
  router.use("/products", createProductRouter(db));
  router.use("/roles", createRoleRouter(db));

  return router;
}

export default createRoutes;
