// src/modules/roles/role.service.ts

import { RoleRepository } from "./role.repository.js";

import { ConflictError } from "../../errors/ConflictError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";

import type { CreateRoleInput, UpdateRoleInput } from "./role.validation.js";
import type { Role } from "./role.types.js";

export class RoleService {
  constructor(private readonly repository: RoleRepository) {}

  async createRole(input: CreateRoleInput): Promise<Role> {
    const product = await this.repository.findProductById(input.productId);

    if (!product) {
      throw new BadRequestError(`Unknown product id: ${input.productId}`);
    }

    if (product.status !== "ACTIVE") {
      throw new BadRequestError(
        `Product ${input.productId} is not currently active`,
      );
    }

    const existing = await this.repository.findByProductAndCode(
      input.productId,
      input.code,
    );

    if (existing) {
      throw new ConflictError(
        `A role with code "${input.code}" already exists for this product`,
      );
    }

    const id = await this.repository.create({
      productId: input.productId,
      name: input.name,
      code: input.code,
      description: input.description ?? null,
    });

    const role = await this.repository.findById(id);

    if (!role) {
      throw new Error("Failed to load role after creation");
    }

    return role;
  }

  async getRoleById(id: number): Promise<Role> {
    const role = await this.repository.findById(id);

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    return role;
  }

  async listRoles(params: {
    productId?: number;
    scope?: string;
    status?: string;
    page: number;
    pageSize: number;
  }) {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    const { items, total } = await this.repository.list({
      ...(params.productId !== undefined
        ? { productId: params.productId }
        : {}),
      ...(params.scope !== undefined ? { scope: params.scope } : {}),
      ...(params.status !== undefined ? { status: params.status } : {}),
      limit,
      offset,
    });

    return {
      items,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  async updateRole(id: number, input: UpdateRoleInput): Promise<Role> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Role not found");
    }

    await this.repository.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
    });

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Role not found");
    }

    return updated;
  }

  async setRoleStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<{ role: Role; activeAssignments: number }> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Role not found");
    }

    const activeAssignments = await this.repository.countActiveAssignments(id);

    await this.repository.setStatus(id, status);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Role not found");
    }

    return { role: updated, activeAssignments };
  }
}
