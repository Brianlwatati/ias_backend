// src/middleware/validateQuery.ts

import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

import { BadRequestError } from "../errors/BadRequestError.js";

export function validateQuery(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      throw new BadRequestError(
        "Invalid query parameters",
        result.error.flatten().fieldErrors,
      );
    }

    // Express 5 makes req.query a getter-only property in some setups;
    // stash the parsed/coerced result separately to avoid fighting that.
    (req as Request & { validatedQuery: unknown }).validatedQuery = result.data;

    next();
  };
}
