// src/routes/routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { createAuthRouter } from "../modules/auth/auth.routes.js";

export function createRoutes(db: mysql.Pool): Router {
  const router = Router();

  router.use("/auth", createAuthRouter(db));

  return router;
}

export default createRoutes;
