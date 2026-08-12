import { AppError } from "./AppError.js";

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);

    this.name = "UnauthorizedError";
  }
}
