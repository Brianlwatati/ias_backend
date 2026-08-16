// src/modules/company-products/company-product.controller.ts

import type { Request, Response } from "express";

import { CompanyProductService } from "./company-product.service.js";
import type {
  GrantCompanyProductInput,
  UpdateCompanyProductStatusInput,
} from "./company-product.validation.js";

export class CompanyProductController {
  constructor(private readonly service: CompanyProductService) {}

  grant = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);
    const { productId } = req.body as GrantCompanyProductInput;

    const companyProduct = await this.service.grantProduct(
      companyId,
      productId,
    );

    res.status(201).json({
      success: true,
      message: "Product granted to company successfully",
      data: companyProduct,
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const companyId = Number(req.params.id);

    const items = await this.service.listByCompany(companyId);

    res.status(200).json({
      success: true,
      message: "Company products retrieved successfully",
      data: items,
    });
  };

  getbyid = async (req: Request, res: Response): Promise<void> => {
    const companyProductId = Number(req.params.companyProductId);

    const items = await this.service.getById(companyProductId);

    res.status(200).json({
      success: true,
      message: "Company product retrieved successfully",
      data: items,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const companyProductId = Number(req.params.companyProductId);
    const { status } = req.body as UpdateCompanyProductStatusInput;

    const companyProduct = await this.service.setStatus(
      companyProductId,
      status,
    );

    res.status(200).json({
      success: true,
      message: "Company product status updated successfully",
      data: companyProduct,
    });
  };
}
