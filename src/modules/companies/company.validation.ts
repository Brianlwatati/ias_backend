// src/modules/companies/company.validation.ts

import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(150),
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .transform((value) => value.toUpperCase()),
  email: z.string().trim().toLowerCase().email().max(255).optional(),
  phone: z.string().trim().max(50).optional(),
});

export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    phone: z.string().trim().max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateCompanyStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type UpdateCompanyStatusInput = z.infer<
  typeof updateCompanyStatusSchema
>;
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;
