import { AppError } from "./AppError.js";

export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super(message, 409, "CONFLICT", details);

    this.name = "ConflictError";
  }
}
