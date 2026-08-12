import { Router } from "express";
import type mysql from "mysql2/promise";

import { AuthRepository } from "./auth.repository.js";

import { AuthService } from "./auth.service.js";

import { AuthController } from "./auth.controller.js";

export function createAuthRouter(db: mysql.Pool): Router {
  const router = Router();

  const repository = new AuthRepository(db);

  const service = new AuthService(repository);

  const controller = new AuthController(service);

  router.post("/login", controller.login);

  router.post("/refresh", controller.refresh);

  return router;
}
