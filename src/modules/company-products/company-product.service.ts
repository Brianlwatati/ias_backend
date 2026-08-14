// src/modules/company-products/company-product.service.ts

import mysql from "mysql2/promise";

import { CompanyProductRepository } from "./company-product.repository.js";
import { withTransaction } from "../../database/transaction.js";

import { NotFoundError } from "../../errors/NotFoundError.js";
import { BadRequestError } from "../../errors/BadRequestError.js";

import type { CompanyProduct } from "./company-product.types.js";

/**
 * Minimal shape needed from companies/products — avoids a
 * circular module dependency by depending on interfaces, not
 * the sibling repositories directly. The routes layer wires
 * in the real repositories from company/product modules.
 */
export interface CompanyLookup {
  findById(
    id: number,
  ): Promise<{ id: number; name: string; code: string; status: string } | null>;
}

export interface ProductLookup {
  findById(
    id: number,
  ): Promise<{ id: number; name: string; code: string; status: string } | null>;
}

export class CompanyProductService {
  constructor(
    private readonly repository: CompanyProductRepository,
    private readonly companies: CompanyLookup,
    private readonly products: ProductLookup,
    private readonly db: mysql.Pool,
  ) {}

  async grantProduct(
    companyId: number,
    productId: number,
  ): Promise<CompanyProduct> {
    return withTransaction(this.db, async (connection) => {
      const company = await this.companies.findById(companyId);

      if (!company) {
        throw new NotFoundError("Company not found");
      }

      if (company.status !== "ACTIVE") {
        throw new BadRequestError(
          `Company is ${company.status.toLowerCase()} and cannot be granted new products`,
        );
      }

      const product = await this.products.findById(productId);

      if (!product) {
        throw new BadRequestError(`Unknown product id: ${productId}`);
      }

      if (product.status !== "ACTIVE") {
        throw new BadRequestError(
          `Product "${product.code}" is not currently available`,
        );
      }

      const id = await this.repository.grant(
        {
          companyId: company.id,
          companyName: company.name,
          companyCode: company.code,
          productId: product.id,
          productName: product.name,
          productCode: product.code,
        },
        connection,
      );

      const companyProduct = await this.repository.findById(id, connection);

      if (!companyProduct) {
        throw new Error("Failed to load company product after grant");
      }

      return companyProduct;
    });
  }

  async listByCompany(companyId: number): Promise<CompanyProduct[]> {
    const company = await this.companies.findById(companyId);

    if (!company) {
      throw new NotFoundError("Company not found");
    }

    return this.repository.listByCompany(companyId);
  }

  async setStatus(
    companyProductId: number,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
  ): Promise<CompanyProduct> {
    const existing = await this.repository.findById(companyProductId);

    if (!existing) {
      throw new NotFoundError("Company product not found");
    }

    const revokedAt =
      status === "INACTIVE" || status === "SUSPENDED" ? new Date() : null;

    await this.repository.setStatus(companyProductId, status, revokedAt);

    const updated = await this.repository.findById(companyProductId);

    if (!updated) {
      throw new NotFoundError("Company product not found");
    }

    return updated;
  }
}
