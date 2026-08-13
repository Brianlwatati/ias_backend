// src/middleware/validateParams.ts

import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

import { BadRequestError } from "../errors/BadRequestError.js";

export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      throw new BadRequestError(
        "Invalid URL parameters",
        result.error.flatten().fieldErrors,
      );
    }

    // Express types req.params as Record<string, string>; we're
    // intentionally overwriting with coerced/parsed values (e.g. id: number).
    req.params = result.data as unknown as Request["params"];

    next();
  };
}
