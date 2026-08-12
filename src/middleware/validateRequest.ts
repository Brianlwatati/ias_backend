import type { Request, Response, NextFunction } from "express";

import type { ZodType } from "zod";

export function validateRequest(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });

      return;
    }

    req.body = result.data;

    next();
  };
}
