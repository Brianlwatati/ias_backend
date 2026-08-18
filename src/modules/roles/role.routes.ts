// src/modules/roles/role.routes.ts

import { Router } from "express";

import type { Pool } from "pg";

import { RoleController } from "./role.controller.js";
import { RoleRepository } from "./role.repository.js";
import { RoleService } from "./role.service.js";

import {
  createRoleSchema,
  updateRoleSchema,
  updateRoleStatusSchema,
  roleIdParamSchema,
  listRolesQuerySchema,
} from "./role.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { validateQuery } from "../../middleware/validateQuery.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";

export function createRoleRouter(db: Pool): Router {
  const router = Router();

  const repository = new RoleRepository(db);
  const service = new RoleService(repository);
  const controller = new RoleController(service);

  /**
   * GET routes are open to any authenticated user — a Company
   * Admin needs to browse available roles when granting product
   * access to their users (e.g. "what roles exist for HR?").
   *
   * Mutating routes are SUPER_ADMIN only — role definitions are
   * platform-level, same tier as products themselves.
   */
  router.get(
    "/",
    authenticate,
    validateQuery(listRolesQuerySchema),
    controller.list,
  );

  router.get(
    "/:id",
    authenticate,
    validateParams(roleIdParamSchema),
    controller.getById,
  );

  router.post(
    "/",
    authenticate,
    authorize("SUPER_ADMIN"),
    validateRequest(createRoleSchema),
    controller.create,
  );

  router.patch(
    "/:id",
    authenticate,
    authorize("SUPER_ADMIN"),
    validateParams(roleIdParamSchema),
    validateRequest(updateRoleSchema),
    controller.update,
  );

  router.patch(
    "/:id/status",
    authenticate,
    authorize("SUPER_ADMIN"),
    validateParams(roleIdParamSchema),
    validateRequest(updateRoleStatusSchema),
    controller.updateStatus,
  );

  return router;
}
