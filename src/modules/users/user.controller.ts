// src/modules/users/user.controller.ts

import type { Request, Response } from "express";

import { UserService } from "./user.service.js";
import type {
  CreateCompanyUserInput,
  UpdateCompanyUserInput,
  UpdateCompanyUserStatusInput,
  ListCompanyUsersQuery,
} from "./user.validation.js";

export class UserController {
  constructor(private readonly userService: UserService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const input = req.body as CreateCompanyUserInput;

    const user = await this.userService.createCompanyUser(companyId, input);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);

    const query = (req as Request & { validatedQuery: ListCompanyUsersQuery })
      .validatedQuery;

    const result = await this.userService.listCompanyUsers({
      companyId,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const user = await this.userService.getCompanyUser(userId, companyId);

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const userId = Number(req.params.userId);
    const input = req.body as UpdateCompanyUserInput;

    const user = await this.userService.updateCompanyUser(
      userId,
      companyId,
      input,
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const userId = Number(req.params.userId);
    const { status } = req.body as UpdateCompanyUserStatusInput;

    const user = await this.userService.setCompanyUserStatus(
      userId,
      companyId,
      status,
    );

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  };
}
