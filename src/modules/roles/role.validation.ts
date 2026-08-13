// src/modules/roles/role.validation.ts

import { z } from "zod";

/**
 * Only PRODUCT-scoped role creation is exposed via API for now.
 * SYSTEM roles (SUPER_ADMIN, COMPANY_ADMIN) stay seed-managed —
 * they're structural to the platform, not something that should
 * be creatable ad hoc.
 */
export const createRoleSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  code: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => value.toUpperCase()),
  description: z.string().trim().max(255).optional(),
});

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(255).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateRoleStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const roleIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listRolesQuerySchema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  scope: z.enum(["SYSTEM", "PRODUCT"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRoleStatusInput = z.infer<typeof updateRoleStatusSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
