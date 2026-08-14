// src/modules/company-products/company-product.types.ts

export interface CompanyProduct {
  id: number;
  companyId: number;
  companyName: string;
  companyCode: string;
  productId: number;
  productName: string;
  productCode: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  grantedAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
