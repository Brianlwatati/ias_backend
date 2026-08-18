// src/routes/routes.ts

import { Router } from "express";

import type { Pool } from "pg";

import { createAuthRouter } from "../modules/auth/auth.routes.js";
import { createCompanyRouter } from "../modules/companies/company.routes.js";
import { createProductRouter } from "../modules/products/product.routes.js";
import { createRoleRouter } from "../modules/roles/role.routes.js";
// import { createCompanyUserRouter } from "../modules/users/user.routes.js";
// import { createCompanyProductRouter } from "../modules/company-product/company-product.routes.js";

export function createRoutes(db: Pool): Router {
  const router = Router();

  router.use("/auth", createAuthRouter(db));
  router.use("/companies", createCompanyRouter(db));
  router.use("/products", createProductRouter(db));
  router.use("/roles", createRoleRouter(db));

  return router;
}

export default createRoutes;
