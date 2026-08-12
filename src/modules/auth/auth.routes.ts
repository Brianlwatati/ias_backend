import { Router } from "express";

import { AuthRepository } from "./auth.repository.js";

import { AuthService } from "./auth.service.js";

import { AuthController } from "./auth.controller.js";

export function createAuthRouter(db: import("mysql2/promise").Pool): Router {
  const router = Router();

  const repository = new AuthRepository(db);

  const service = new AuthService(repository);

  const controller = new AuthController(service);

  router.post("/login", controller.login);

  return router;
}
