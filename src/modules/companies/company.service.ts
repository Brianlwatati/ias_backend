// src/modules/companies/company.service.ts

import mysql from "mysql2/promise";

import { CompanyRepository } from "./company.repository.js";
import { hashPassword } from "../../utils/password.js";
import { withTransaction } from "../../database/transaction.js";

import { ConflictError } from "../../errors/ConflictError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";

import type {
  CreateCompanyInput,
  UpdateCompanyInput,
  AssignProductInput,
} from "./company.validation.js";
import type {
  Company,
  CompanyProduct,
  ListCompaniesParams,
} from "./company.types.js";

export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly db: mysql.Pool,
  ) {}

  /**
   * Create a company and its first Company Admin atomically.
   *
   * If any step fails (duplicate code, unknown product,
   * duplicate admin email), the entire operation rolls back —
   * you never end up with a company that has no admin, or
   * an admin without a company.
   */
  async createCompany(
    input: CreateCompanyInput,
  ): Promise<{ company: Company; adminUserId: number }> {
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

      const existingAdmin = await this.repository.findUserByEmail(
        input.admin.email,
        connection,
      );

      if (existingAdmin) {
        throw new ConflictError(
          `A user with email "${input.admin.email}" already exists`,
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

      for (const productCode of input.productCodes) {
        const product = await this.repository.findProductByCode(
          productCode,
          connection,
        );

        if (!product) {
          throw new BadRequestError(`Unknown product code: "${productCode}"`);
        }

        if (product.status !== "ACTIVE") {
          throw new BadRequestError(
            `Product "${productCode}" is not currently available`,
          );
        }

        await this.repository.addCompanyProduct(
          companyId,
          product.id,
          null,
          connection,
        );
      }

      const companyAdminRole = await this.repository.findSystemRoleByCode(
        "COMPANY_ADMIN",
        connection,
      );

      if (!companyAdminRole) {
        /**
         * This is a deployment/seed problem, not a user input
         * problem — the COMPANY_ADMIN system role must exist
         * before this endpoint can ever succeed.
         */
        throw new Error(
          "COMPANY_ADMIN system role is not seeded. Run the seed script first.",
        );
      }

      const passwordHash = await hashPassword(input.admin.password);

      const adminUserId = await this.repository.createCompanyAdmin(
        {
          companyId,
          roleId: companyAdminRole.id,
          email: input.admin.email,
          passwordHash,
          firstName: input.admin.firstName,
          lastName: input.admin.lastName,
        },
        connection,
      );

      const company = await this.repository.findById(companyId, connection);

      if (!company) {
        throw new Error("Failed to load company after creation");
      }

      return { company, adminUserId };
    });
  }

  async getCompanyById(id: number): Promise<Company> {
    const company = await this.repository.findById(id);

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    return company;
  }

  async listCompanies(params: ListCompaniesParams) {
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

  async assignProduct(
    companyId: number,
    input: AssignProductInput,
  ): Promise<CompanyProduct[]> {
    const company = await this.repository.findById(companyId);

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    const product = await this.repository.findProductByCode(input.productCode);

    if (!product) {
      throw new BadRequestError(`Unknown product code: "${input.productCode}"`);
    }

    if (product.status !== "ACTIVE") {
      throw new BadRequestError(
        `Product "${input.productCode}" is not currently available`,
      );
    }

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    await this.repository.addCompanyProduct(companyId, product.id, expiresAt);

    return this.repository.listCompanyProducts(companyId);
  }

  async listCompanyProducts(companyId: number): Promise<CompanyProduct[]> {
    const company = await this.repository.findById(companyId);

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    return this.repository.listCompanyProducts(companyId);
  }
}
