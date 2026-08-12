import { AppError } from "./AppError.js";

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);

    this.name = "ForbiddenError";
  }
}
