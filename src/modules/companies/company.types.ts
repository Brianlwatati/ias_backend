// src/modules/companies/company.types.ts

export interface Company {
  id: number;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
}

export interface CompanySummary {
  id: number;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface CreateCompanyInput {
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
}

export interface UpdateCompanyInput {
  name?: string | undefined | null;
  email?: string | undefined | null;
  phone?: string | undefined | null;
}

export interface CompanyProduct {
  id: number;
  companyId: number;
  productId: number;
  productCode: string;
  productName: string;
  status: "ACTIVE" | "INACTIVE" | "EXPIRED";
  purchasedAt: string | null;
  expiresAt: string | null;
}

export interface ProductRow {
  id: number;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface SystemRoleRow {
  id: number;
  code: string;
  scope: "SYSTEM" | "PRODUCT";
}

export interface ListCompaniesParams {
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface queryListCompaniesParams {
  status?: string | undefined | null;
  search?: string | undefined | null;
  limit: number;
  offset: number;
}

export interface ListCompaniesResult {
  items: Company[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
