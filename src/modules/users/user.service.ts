// src/modules/users/user.service.ts

import { UserRepository } from "./user.repository.js";
import { hashPassword } from "../../utils/password.js";

import { ConflictError } from "../../errors/ConflictError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

import type {
  CreateCompanyUserInput,
  UpdateCompanyUserInput,
} from "./user.validation.js";
import type { CompanyUser } from "./user.types.js";

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createCompanyUser(
    companyId: number,
    input: CreateCompanyUserInput,
  ): Promise<CompanyUser> {
    const existing = await this.repository.findByEmail(input.email);

    if (existing) {
      throw new ConflictError(
        `A user with email "${input.email}" already exists`,
      );
    }

    const passwordHash = await hashPassword(input.password);

    const userId = await this.repository.create({
      companyId,
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName ?? null,
      systemRoleId: input.systemRoleId,
    });

    const user = await this.repository.findByIdAndCompany(userId, companyId);

    if (!user) {
      throw new Error("Failed to load user after creation");
    }

    return user;
  }

  async getCompanyUser(
    userId: number,
    companyId: number,
  ): Promise<CompanyUser> {
    const user = await this.repository.findByIdAndCompany(userId, companyId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return user;
  }

  async listCompanyUsers(params: {
    companyId: number;
    status?: string;
    search?: string;
    page: number;
    pageSize: number;
  }) {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    const { items, total } = await this.repository.listByCompany({
      companyId: params.companyId,
      ...(params.status !== undefined ? { status: params.status } : {}),
      ...(params.search !== undefined ? { search: params.search } : {}),
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

  async updateCompanyUser(
    userId: number,
    companyId: number,
    input: UpdateCompanyUserInput,
  ): Promise<CompanyUser> {
    const existing = await this.repository.findByIdAndCompany(
      userId,
      companyId,
    );

    if (!existing) {
      throw new NotFoundError("User not found");
    }

    // build update payload so optional undefined fields are not passed
    const updatePayload: Partial<{
      firstName: string;
      lastName: string | null;
    }> = {};

    if (input.firstName !== undefined) {
      updatePayload.firstName = input.firstName;
    }

    if (Object.prototype.hasOwnProperty.call(input, "lastName")) {
      // explicit null allowed for lastName
      updatePayload.lastName = input.lastName ?? null;
    }

    await this.repository.update(userId, companyId, updatePayload);

    const updated = await this.repository.findByIdAndCompany(userId, companyId);

    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return updated;
  }

  async setCompanyUserStatus(
    userId: number,
    companyId: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<CompanyUser> {
    const existing = await this.repository.findByIdAndCompany(
      userId,
      companyId,
    );

    if (!existing) {
      throw new NotFoundError("User not found");
    }

    await this.repository.setStatus(userId, companyId, status);

    const updated = await this.repository.findByIdAndCompany(userId, companyId);

    if (!updated) {
      throw new NotFoundError("User not found");
    }

    return updated;
  }
}
