import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  API_PREFIX: z.string().default("/api/v1"),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),

  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),

  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().min(1),
  SUPER_ADMIN_EMAIL: z.string().email(),

  SUPER_ADMIN_PASSWORD: z.string().min(12),

  SUPER_ADMIN_FIRST_NAME: z.string().min(1),

  SUPER_ADMIN_LAST_NAME: z.string().min(1),
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
