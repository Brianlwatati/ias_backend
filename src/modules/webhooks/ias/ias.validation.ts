import { z } from "zod";

const companySchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1).max(150),
  code: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .transform((value) => value.toUpperCase()),
  email: z.email().trim().toLowerCase().max(255).nullish(),
  phone: z.string().trim().max(50).nullish(),
});

const userSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  email: z.email().trim().toLowerCase().max(255),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).nullish(),
  companyId: z.coerce.number().int().positive().optional(),
  companyCode: z.string().trim().min(1).max(50).optional(),
});

export const companyProvisionedSchema = z
  .object({
    company: companySchema.optional(),
    companyId: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    code: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .transform((value) => value.toUpperCase())
      .optional(),
    email: z.email().trim().toLowerCase().max(255).nullish(),
    phone: z.string().trim().max(50).nullish(),
  })
  .superRefine((value, context) => {
    if (!value.company && (!value.name || !value.code)) {
      context.addIssue({
        code: "custom",
        path: ["company"],
        message: "company or name and code is required",
      });
    }
  });

export const userCreatedSchema = z
  .object({
    user: userSchema.optional(),
    userId: z.coerce.number().int().positive().optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().max(100).nullish(),
    companyId: z.coerce.number().int().positive().optional(),
    companyCode: z.string().trim().min(1).max(50).optional(),
  })
  .superRefine((value, context) => {
    if (!value.user && (!value.email || !value.firstName)) {
      context.addIssue({
        code: "custom",
        path: ["user"],
        message: "user or email and firstName is required",
      });
    }
  });

export type CompanyProvisionedInput = z.infer<typeof companyProvisionedSchema>;
export type UserCreatedInput = z.infer<typeof userCreatedSchema>;
