// src/modules/company-products/company-product.validation.ts

import { z } from "zod";

export const grantCompanyProductSchema = z.object({
  productId: z.coerce.number().int().positive(),
});

export const updateCompanyProductStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const companyProductIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  companyProductId: z.coerce.number().int().positive(),
});

export type GrantCompanyProductInput = z.infer<
  typeof grantCompanyProductSchema
>;
export type UpdateCompanyProductStatusInput = z.infer<
  typeof updateCompanyProductStatusSchema
>;
