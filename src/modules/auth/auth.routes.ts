import { Router } from "express";

import type mysql from "mysql2/promise";

import { AuthController } from "./auth.controller.js";

import { AuthRepository } from "./auth.repository.js";

import { AuthService } from "./auth.service.js";

import { loginSchema, refreshSchema } from "./auth.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";

export function createAuthRouter(db: mysql.Pool): Router {
  const router = Router();

  /*
   * Dependencies
   *
   * Router
   *   ↓
   * Controller
   *   ↓
   * Service
   *   ↓
   * Repository
   */
  const repository = new AuthRepository(db);

  const service = new AuthService(repository, db);

  const controller = new AuthController(service);

  /*
   * POST /login
   *
   * Request:
   * {
   *   "email": "admin@example.com",
   *   "password": "password"
   * }
   */
  router.post("/login", validateRequest(loginSchema), controller.login);

  /*
   * POST /refresh
   *
   * Request:
   * {
   *   "refreshToken": "..."
   * }
   */
  router.post("/refresh", validateRequest(refreshSchema), controller.refresh);

  return router;
}
