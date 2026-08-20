// src/middleware/authorizeCompanyAccess.ts

import type { Request, Response, NextFunction } from "express";

import { ForbiddenError } from "../errors/ForbiddenError.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { BadRequestError } from "../errors/BadRequestError.js";
import { AuthenticatedRequest } from "../modules/auth/auth.types.js";

/**
 * Enforces that the authenticated user may act on the company
 * identified by req.params.id.
 *
 * Must run AFTER authenticate() and AFTER validateParams() (so
 * req.params.id is already a coerced number), and typically after
 * authorize(["SUPER_ADMIN", "COMPANY_ADMIN"]) has confirmed the
 * user holds one of those roles at all.
 *
 * Rule:
 * - SUPER_ADMIN may act on any company.
 * - COMPANY_ADMIN may act ONLY on their own company
 *   (req.auth.companyId === the :id in the URL).
 *
 * This is the enforcement point for "never trust companyId
 * from the request — derive it from the authenticated identity."
 * The :id in the URL is untrusted input; req.auth.companyId is
 * the source of truth for what a COMPANY_ADMIN is allowed to touch.
 */
export function authorizeCompanyAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authenticatedRequest = req as AuthenticatedRequest;

    if (!authenticatedRequest.auth) {
      throw new UnauthorizedError("Authentication required");
    }

    const { roleCode, companyId } = authenticatedRequest.auth;

    const targetCompanyId = Number(req.params.id);

    if (!Number.isSafeInteger(targetCompanyId) || targetCompanyId <= 0) {
      throw new BadRequestError("Invalid company id");
    }

    if (roleCode === "SUPER_ADMIN") {
      next();
      return;
    }

    if (roleCode === "COMPANY_ADMIN" && companyId === targetCompanyId) {
      next();
      return;
    }

    throw new ForbiddenError(
      "You do not have permission to manage this company",
    );
  } catch (error) {
    next(error);
  }
}
