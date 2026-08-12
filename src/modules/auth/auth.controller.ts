import type { Request, Response } from "express";

import {
  AuthService,
  type LoginInput,
  type RefreshInput,
} from "./auth.service.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body as LoginInput;

      const result = await this.authService.login(input);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * POST /refresh
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const input = req.body as RefreshInput;

      const result = await this.authService.refresh(input);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Convert service errors into
   * appropriate HTTP responses.
   *
   * We can replace this with custom
   * application errors later.
   */
  private handleError(error: unknown, res: Response): void {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    switch (message) {
      case "Invalid email or password":
        res.status(401).json({
          success: false,
          message,
        });
        return;

      case "Account is not active":
        res.status(403).json({
          success: false,
          message,
        });
        return;

      case "Invalid refresh token":
      case "Refresh token has been revoked":
      case "Refresh token has expired":
        res.status(401).json({
          success: false,
          message,
        });
        return;

      case "User no longer exists":
        res.status(401).json({
          success: false,
          message,
        });
        return;

      default:
        console.error(error);

        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
    }
  }
}
