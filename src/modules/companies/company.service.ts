// src/modules/companies/company.service.ts

import mysql from "mysql2/promise";

import { CompanyRepository } from "./company.repository.js";
import { withTransaction } from "../../database/transaction.js";

import { ConflictError } from "../../errors/ConflictError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

import type {
  CreateCompanyInput,
  UpdateCompanyInput,
} from "./company.validation.js";
import type { Company } from "./company.types.js";

export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly db: mysql.Pool,
  ) {}

  /**
   * Create a company record only — name, code, email, phone.
   *
   * No admin user and no product entitlements are created here.
   * A Company Admin is added afterward via the users module
   * (POST /companies/:id/users), and products are granted via
   * the company-products module (POST /companies/:id/company-products).
   */
  async createCompany(input: CreateCompanyInput): Promise<Company> {
    return withTransaction(this.db, async (connection) => {
      const existingByCode = await this.repository.findByCode(
        input.code,
        connection,
      );

      if (existingByCode) {
        throw new ConflictError(
          `A company with code "${input.code}" already exists`,
        );
      }

      const companyId = await this.repository.create(
        {
          name: input.name,
          code: input.code,
          email: input.email ?? null,
          phone: input.phone ?? null,
        },
        connection,
      );

      const company = await this.repository.findById(companyId, connection);

      if (!company) {
        throw new Error("Failed to load company after creation");
      }

      return company;
    });
  }

  async getCompanyById(id: number): Promise<Company> {
    const company = await this.repository.findById(id);

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    return company;
  }

  async listCompanies(params: {
    status?: string;
    search?: string;
    page: number;
    pageSize: number;
  }) {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    const { items, total } = await this.repository.list({
      status: params.status,
      search: params.search,
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

  async updateCompany(id: number, input: UpdateCompanyInput): Promise<Company> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Company not found");
    }

    await this.repository.update(id, input);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Company not found");
    }

    return updated;
  }

  async setCompanyStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<Company> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Company not found");
    }

    await this.repository.setStatus(id, status);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Company not found");
    }

    return updated;
  }
}
