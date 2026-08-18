// src/config/env.ts

import "dotenv/config";
import { z } from "zod";
import type { StringValue } from "ms";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    PORT: z.coerce.number().int().positive().default(5000),

    API_PREFIX: z.string().default("/api/v1"),

    // Set DATABASE_URL for managed providers (Render, Railway, Neon,
    // etc.) and it takes priority over the discrete DB_* fields below.
    // Those fields stay around for local dev where a full connection
    // string is more hassle than it's worth.
    DATABASE_URL: z.string().url().optional(),

    DB_HOST: z.string().min(1).optional(),
    DB_PORT: z.coerce.number().int().positive().default(5432),
    DB_NAME: z.string().min(1).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_PASSWORD: z.string().optional(),

    // Managed Postgres providers require SSL on external connections.
    // Auto-true when DATABASE_URL is set; can also be forced on for
    // discrete-field connections that need it (e.g. hitting Render's
    // external host directly instead of via DATABASE_URL).
    DB_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),

    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),

    CORS_ORIGIN: z.string().min(1),
    SUPER_ADMIN_EMAIL: z.email(),
    SUPER_ADMIN_PHONE: z.string().min(10).max(20),

    SUPER_ADMIN_PASSWORD: z.string().min(12),

    SUPER_ADMIN_FIRST_NAME: z.string().min(1),

    SUPER_ADMIN_LAST_NAME: z.string().min(1),

    JWT_ACCESS_SECRET: z.string().min(32),

    JWT_ACCESS_EXPIRES_IN: z
      .string()
      .default("15m")
      .transform((value) => value as StringValue),

    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .default("7d")
      .transform((value) => value as StringValue),
  })
  .superRefine((data, ctx) => {
    if (data.DATABASE_URL) return;

    for (const field of [
      "DB_HOST",
      "DB_NAME",
      "DB_USER",
      "DB_PASSWORD",
    ] as const) {
      if (!data[field]) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is required when DATABASE_URL is not set`,
        });
      }
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment configuration:",
    result.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = result.data;
