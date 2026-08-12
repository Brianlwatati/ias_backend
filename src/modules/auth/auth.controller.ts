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
   *
   * Authentication errors are handled by the
   * global errorHandler middleware.
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;

    const result = await this.authService.login(input);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  };

  /**
   * POST /refresh
   *
   * Refresh-token errors are handled by the
   * global errorHandler middleware.
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RefreshInput;

    const result = await this.authService.refresh(input);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  };
}
