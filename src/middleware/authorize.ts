// src/middleware/authorize.ts
// src/middleware/authorize.ts

import type { Request, Response, NextFunction } from "express";

import { ForbiddenError } from "../errors/ForbiddenError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { AuthenticatedRequest } from "../modules/auth/auth.types.js";

/**
 * Role-based authorization middleware.
 *
 * Must run AFTER authenticate(), since it depends on
 * req.auth being populated.
 *
 * Usage:
 *
 *   router.post(
 *     "/companies",
 *     authenticate,
 *     authorize("SUPER_ADMIN"),
 *     controller.createCompany,
 *   );
 *
 *   router.post(
 *     "/users",
 *     authenticate,
 *     authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]),
 *     controller.createUser,
 *   );
 *
 * NOTE: This checks the user's single system-level role
 * (SUPER_ADMIN / COMPANY_ADMIN / etc.), not per-product
 * permissions (e.g. HR_USERS_CREATE). Per-product permission
 * checks belong in a separate middleware once user_products /
 * role_permissions lookups are wired up.
 */
export function authorize(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authenticatedRequest = req as AuthenticatedRequest;

      if (!authenticatedRequest.auth) {
        /**
         * This should never happen if authenticate() ran first.
         * Treat it as a misconfiguration rather than silently
         * allowing the request through.
         */
        throw new UnauthorizedError("Authentication required");
      }

      const { roleCode } = authenticatedRequest.auth;

      if (!roleCode || !roles.includes(roleCode)) {
        throw new ForbiddenError(
          "You do not have permission to perform this action",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
