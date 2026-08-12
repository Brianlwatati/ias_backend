import type { Request, Response, NextFunction } from "express";

import { verifyAccessToken } from "../utils/jwt.js";

import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: number;
    role: string | null;
    companyId: number | null;
  };
}

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

    const companyId =
      payload.companyId !== undefined ? Number(payload.companyId) : null;

    if (
      companyId !== null &&
      (!Number.isSafeInteger(companyId) || companyId <= 0)
    ) {
      throw new UnauthorizedError("Invalid access token");
    }

    /**
     * Attach authenticated identity
     * to the request.
     */
    (req as AuthenticatedRequest).auth = {
      userId,
      role: payload.role ?? null,
      companyId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
