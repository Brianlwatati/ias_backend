// src/modules/users/user.routes.ts

import { Router } from "express";

import type mysql from "mysql2/promise";

import { UserController } from "./user.controller.js";
import { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";

import {
  createCompanyUserSchema,
  updateCompanyUserSchema,
  updateCompanyUserStatusSchema,
  companyIdParamSchema,
  companyUserIdParamSchema,
  listCompanyUsersQuerySchema,
} from "./user.validation.js";

import { validateRequest } from "../../middleware/validateRequest.js";
import { validateParams } from "../../middleware/validateParams.js";
import { validateQuery } from "../../middleware/validateQuery.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { authorizeCompanyAccess } from "../../middleware/authorizeCompanyAccess.js";

/**
 * Mounted at /companies/:id/users — nested under a specific company.
 *
 * Every route here requires the caller to be either SUPER_ADMIN
 * (any company) or COMPANY_ADMIN of THIS specific company — enforced
 * by authorize() (role check) followed by authorizeCompanyAccess()
 * (ownership check against req.auth.companyId, never the URL param).
 */
export function createCompanyUserRouter(db: mysql.Pool): Router {
  const router = Router({ mergeParams: true });

  const repository = new UserRepository(db);
  const service = new UserService(repository);
  const controller = new UserController(service);

  router.use(
    authenticate,
    authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]),
    validateParams(companyIdParamSchema),
    authorizeCompanyAccess,
  );

  router.post("/", validateRequest(createCompanyUserSchema), controller.create);

  router.get("/", validateQuery(listCompanyUsersQuerySchema), controller.list);

  router.get(
    "/:userId",
    validateParams(companyUserIdParamSchema),
    controller.getById,
  );

  router.patch(
    "/:userId",
    validateParams(companyUserIdParamSchema),
    validateRequest(updateCompanyUserSchema),
    controller.update,
  );

  router.patch(
    "/:userId/status",
    validateParams(companyUserIdParamSchema),
    validateRequest(updateCompanyUserStatusSchema),
    controller.updateStatus,
  );

  return router;
}
