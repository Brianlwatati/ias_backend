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

  /**
   * Product codes to grant to the company at creation time.
   * Optional — a company can be created with zero products
   * and have them assigned later via POST /companies/:id/products.
   */
  productCodes: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(50)
        .transform((value) => value.toUpperCase()),
    )
    .default([]),

  /**
   * The company's first admin user, created atomically
   * with the company itself.
   */
  admin: z.object({
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(12).max(128),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
  }),
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

export const assignProductSchema = z.object({
  productCode: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .transform((value) => value.toUpperCase()),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type UpdateCompanyStatusInput = z.infer<
  typeof updateCompanyStatusSchema
>;
export type AssignProductInput = z.infer<typeof assignProductSchema>;
export type CompanyIdParam = z.infer<typeof companyIdParamSchema>;
