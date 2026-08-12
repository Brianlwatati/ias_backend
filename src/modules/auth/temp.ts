import { Router } from "express";

import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { AuthRepository } from "./auth.repository.js";

import { db } from "../../config/database.js";

import { authenticate } from "../../middleware/authenticate.js";
import { validateRequest } from "../../middleware/validateRequest.js";

import { loginSchema, refreshSchema } from "./auth.validation.js";

const router = Router();

const authRepository = new AuthRepository(db);

const authService = new AuthService(authRepository, db);

const authController = new AuthController(authService);

/**
 * Public authentication routes
 */

router.post("/login", validateRequest(loginSchema), authController.login);

router.post("/refresh", validateRequest(refreshSchema), authController.refresh);

/**
 * Authenticated routes
 */

router.get("/me", authenticate, authController.me);

router.post("/logout", validateRequest(refreshSchema), authController.logout);

router.post("/logout-all", authenticate, authController.logoutAll);

export default router;
