// src/modules/companies/company.controller.ts

import type { Request, Response } from "express";

import { CompanyService } from "./company.service.js";
import type {
  CreateCompanyInput,
  UpdateCompanyInput,
  UpdateCompanyStatusInput,
} from "./company.validation.js";

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateCompanyInput;

    const result = await this.companyService.createCompany(input);

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: {
        company: result,
      },
    });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;

    const pageSize =
      Number(req.query.pageSize) > 0
        ? Math.min(Number(req.query.pageSize), 100)
        : 20;

    const result = await this.companyService.listCompanies({
      page,
      pageSize,
      ...(typeof req.query.status === "string" && { status: req.query.status }),
      ...(typeof req.query.search === "string" && { search: req.query.search }),
    });

    res.status(200).json({
      success: true,
      message: "Companies retrieved successfully",
      data: result.items,
      pagination: result.pagination,
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const company = await this.companyService.getCompanyById(id);

    res.status(200).json({
      success: true,
      message: "Company retrieved successfully",
      data: company,
    });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const input = req.body as UpdateCompanyInput;

    const company = await this.companyService.updateCompany(id, input);

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { status } = req.body as UpdateCompanyStatusInput;

    const company = await this.companyService.setCompanyStatus(id, status);

    res.status(200).json({
      success: true,
      message: "Company status updated successfully",
      data: company,
    });
  };
}
