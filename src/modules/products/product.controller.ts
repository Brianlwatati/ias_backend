// src/modules/products/product.controller.ts

import type { Request, Response } from "express";

import { ProductService } from "./product.service.js";
import type {
  CreateProductInput,
  UpdateProductInput,
  UpdateProductStatusInput,
  ListProductsQuery,
} from "./product.validation.js";

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateProductInput;

    const product = await this.productService.createProduct(input);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = (req as Request & { validatedQuery: ListProductsQuery })
      .validatedQuery;

    const result = await this.productService.listProducts({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
    });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const product = await this.productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const input = req.body as UpdateProductInput;

    const product = await this.productService.updateProduct(id, input);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { status } = req.body as UpdateProductStatusInput;

    const result = await this.productService.setProductStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Product status updated successfully",
      data: result.product,
      meta: {
        activeCompanySubscriptions: result.activeSubscriptions,
      },
    });
  };
}
