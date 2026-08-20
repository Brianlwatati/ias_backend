// src/middleware/authenticate.ts

import type { Request, Response, NextFunction } from "express";

import { verifyAccessToken } from "../utils/jwt.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { AuthenticatedRequest } from "../modules/auth/auth.types.js";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedError("Authentication required");
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Invalid authorization header");
    }

    const payload = verifyAccessToken(token);

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new UnauthorizedError("Invalid access token");
    }

    let companyId: number | null = null;

    if (payload.companyId !== undefined) {
      companyId = Number(payload.companyId);

      if (!Number.isSafeInteger(companyId) || companyId <= 0) {
        throw new UnauthorizedError("Invalid access token");
      }
    }

    const authenticatedRequest = req as AuthenticatedRequest;

    authenticatedRequest.auth = {
      userId,
      roleName: payload.roleName,
      roleCode: payload.roleCode,
      roleScope: payload.roleScope,
      roleScopeKey: payload.roleScopeKey,
      companyId: companyId !== null ? companyId : 0,
    };

    next();
  } catch (error) {
    next(error);
  }
}
