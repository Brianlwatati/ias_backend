// src/modules/users/user.validation.ts

import { z } from "zod";

export const createCompanyUserSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(12).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100).optional(),
  companyId: z.coerce.number().int().positive(),
  systemRoleId: z.coerce.number().int().positive(),
});

export const updateCompanyUserSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateCompanyUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const companyIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const companyUserIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

export const listCompanyUsersQuerySchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).optional(),
  search: z.string().trim().max(150).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateCompanyUserInput = z.infer<typeof createCompanyUserSchema>;
export type UpdateCompanyUserInput = z.infer<typeof updateCompanyUserSchema>;
export type UpdateCompanyUserStatusInput = z.infer<
  typeof updateCompanyUserStatusSchema
>;
export type CompanyUserIdParam = z.infer<typeof companyUserIdParamSchema>;
export type ListCompanyUsersQuery = z.infer<typeof listCompanyUsersQuerySchema>;
