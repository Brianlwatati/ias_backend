// src/modules/roles/role.controller.ts

import type { Request, Response } from "express";

import { RoleService } from "./role.service.js";
import type {
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRoleStatusInput,
  ListRolesQuery,
} from "./role.validation.js";

export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateRoleInput;

    const role = await this.roleService.createRole(input);

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = (req as Request & { validatedQuery: ListRolesQuery })
      .validatedQuery;

    const result = await this.roleService.listRoles({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.productId !== undefined ? { productId: query.productId } : {}),
      ...(query.scope !== undefined ? { scope: query.scope } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Roles retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const role = await this.roleService.getRoleById(id);

    res.status(200).json({
      success: true,
      message: "Role retrieved successfully",
      data: role,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const input = req.body as UpdateRoleInput;

    const role = await this.roleService.updateRole(id, input);

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { status } = req.body as UpdateRoleStatusInput;

    const result = await this.roleService.setRoleStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Role status updated successfully",
      data: result.role,
      meta: {
        activeAssignments: result.activeAssignments,
      },
    });
  };
}
