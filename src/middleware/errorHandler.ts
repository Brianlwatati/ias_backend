// src/middleware/errorHandler.ts

import type {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from "express";

import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Malformed JSON body (thrown by express.json() body parser
  // before it ever reaches our routes/controllers).
  if (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: number }).status === 400 &&
    "body" in error
  ) {
    res.status(400).json({
      success: false,
      message: "Malformed JSON in request body",
      code: "INVALID_JSON",
    });

    return;
  }

  // Expected application error
  if (error instanceof AppError) {
    const response: {
      success: false;
      message: string;
      code: string;
      details?: unknown;
    } = {
      success: false,
      message: error.message,
      code: error.code,
    };

    if (error.details !== undefined) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);

    return;
  }

  // Unexpected error
  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "INTERNAL_SERVER_ERROR",
  });
};

/**
 * This middleware handles errors thrown in the application.
 * It checks if the error is an instance of AppError and responds accordingly.
 * If the error is unexpected, it logs the error and responds with a generic message.
 */

/*
Request
   ↓
helmet
   ↓
cors
   ↓
body parser
   ↓
rate limiter
   ↓
routes
   ↓
controller
   ↓
service
   ↓
❌ error thrown
   ↓
errorHandler
   ↓
HTTP response
*/
