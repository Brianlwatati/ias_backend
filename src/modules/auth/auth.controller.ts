// src/modules/auth/auth.controller.ts

import type { Request, Response } from "express";

import { AuthService } from "./auth.service.js";
import { AuthenticatedRequest } from "./auth.types.js";
import { toAuthResponseUser } from "./auth.utils.js";
import type { LoginInput, RefreshInput } from "./auth.validation.js";

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

  me = async (req: Request, res: Response): Promise<void> => {
    const authenticatedRequest = req as AuthenticatedRequest;

    const user = await this.authService.getCurrentUser(
      authenticatedRequest.auth.userId,
    );

    const company =
      user.companyId !== null
        ? await this.authService.getCompany(user.companyId)
        : null;

    res.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      data: {
        user: toAuthResponseUser(user, company),
      },
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as RefreshInput;

    await this.authService.revokeSession(refreshToken);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    const authenticatedRequest = req as AuthenticatedRequest;

    await this.authService.revokeAllSessions(authenticatedRequest.auth.userId);

    res.status(200).json({
      success: true,
      message: "All sessions have been logged out",
    });
  };
}
