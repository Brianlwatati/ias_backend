import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export function authenticateIasWebhook(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const configuredSecret = env.IAS_WEBHOOK_SECRET;
  const receivedSecret = req.header("x-ias-webhook-secret");

  if (!configuredSecret || !receivedSecret) {
    next(new UnauthorizedError("Invalid webhook secret"));
    return;
  }

  const expected = Buffer.from(configuredSecret);
  const received = Buffer.from(receivedSecret);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    next(new UnauthorizedError("Invalid webhook secret"));
    return;
  }

  next();
}
