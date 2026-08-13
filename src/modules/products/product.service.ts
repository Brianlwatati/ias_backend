// src/modules/products/product.service.ts

import { ProductRepository } from "./product.repository.js";

import { ConflictError } from "../../errors/ConflictError.js";
import { NotFoundError } from "../../errors/NotFoundError.js";

import type {
  CreateProductInput,
  UpdateProductInput,
} from "./product.validation.js";
import type { Product } from "./product.types.js";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async createProduct(input: CreateProductInput): Promise<Product> {
    const existing = await this.repository.findByCode(input.code);

    if (existing) {
      throw new ConflictError(
        `A product with code "${input.code}" already exists`,
      );
    }

    const id = await this.repository.create({
      name: input.name,
      code: input.code,
      description: input.description ?? null,
    });

    const product = await this.repository.findById(id);

    if (!product) {
      throw new Error("Failed to load product after creation");
    }

    return product;
  }

  async getProductById(id: number): Promise<Product> {
    const product = await this.repository.findById(id);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  }

  async listProducts(params: {
    status?: string;
    search?: string;
    page: number;
    pageSize: number;
  }) {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    const { items, total } = await this.repository.list({
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

  async updateProduct(id: number, input: UpdateProductInput): Promise<Product> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Product not found");
    }

    await this.repository.update(id, {
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
    });

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Product not found");
    }

    return updated;
  }

  /**
   * Deactivating a product doesn't touch existing
   * company_products rows (nothing cascades), but it
   * DOES mean the product should stop being assignable
   * to new companies going forward. We don't hard-block
   * this even if companies are actively using it — that's
   * a legitimate "we're sunsetting this product" action —
   * but we surface the count so the caller/UI can warn
   * the admin before they confirm.
   */
  async setProductStatus(
    id: number,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<{ product: Product; activeSubscriptions: number }> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new NotFoundError("Product not found");
    }

    const activeSubscriptions =
      await this.repository.countActiveCompanySubscriptions(id);

    await this.repository.setStatus(id, status);

    const updated = await this.repository.findById(id);

    if (!updated) {
      throw new NotFoundError("Product not found");
    }

    return { product: updated, activeSubscriptions };
  }
}
