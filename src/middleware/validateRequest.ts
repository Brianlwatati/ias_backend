// src/middleware/validateRequest.ts

import type { Request, NextFunction } from "express";

import type { ZodType } from "zod";

import { BadRequestError } from "../errors/BadRequestError.js";

export function validateRequest(schema: ZodType) {
  return (req: Request, _res: unknown, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      throw new BadRequestError(
        "Validation failed",
        result.error.flatten().fieldErrors,
      );
    }

    req.body = result.data;

    next();
  };
}

/**
 * This middleware validates the request body against a Zod schema.
 * POST /api/auth/login
        │
        ▼
validateRequest(loginSchema)
        │
        ├── ❌ invalid
        │      │
        │      └── 400
        │
        ▼
   sanitized body
        │
        ▼
  auth.controller
        │
        ▼
   auth.service
        │
        ▼
  auth.repository
        │
        ▼
      PostgreSQL

      Clean up auth.utils.ts and use your existing utils/ files.
Verify auth.validation.ts and validateRequest.ts.
Create the errors/ classes.
Create errorHandler.ts.
Update auth.controller.ts to use the global error handler.
Create authenticate.ts.
Implement /auth/me.
Implement /auth/logout.
Implement /auth/logout-all.
Test the complete authentication lifecycle.
 */
