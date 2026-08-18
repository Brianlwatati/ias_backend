import { Router } from "express";

import type { Pool } from "pg";

import { AuthController } from "./auth.controller.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { CompanyRepository } from "../companies/company.repository.js";

import { loginSchema, refreshSchema } from "./auth.validation.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";

export function createAuthRouter(db: Pool): Router {
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
  const companyRepository = new CompanyRepository(db);

  const service = new AuthService(repository, companyRepository, db);

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

  /**
   * Authenticated routes
   */

  /** * Logout routes
   * 
   * POST /auth/logout
   * Request:
   * {
      "refreshToken": "Refresh Token A"
    }
   */

  router.get("/me", authenticate, controller.me);

  router.post("/logout", validateRequest(refreshSchema), controller.logout);

  router.post("/logout-all", authenticate, controller.logoutAll);

  return router;
}
