// src/modules/auth/auth.validation.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(255),
  password: z.string().min(1).max(128),
  productCode: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .transform((value) => value.toUpperCase()),
});

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1).max(512),
});

export type LoginInput = z.infer<typeof loginSchema>;

export type RefreshInput = z.infer<typeof refreshSchema>;
