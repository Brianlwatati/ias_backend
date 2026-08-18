// src/config/database.ts

import { Pool, types } from "pg";
import { env } from "./env.js";

// PostgreSQL returns BIGINT (OID 20) as strings by default. The application
// models IDs as numbers, so parse BIGINT values as JavaScript numbers.
types.setTypeParser(20, (value) => Number.parseInt(value, 10));

export const db = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  options: "-c timezone=UTC",
});

export async function initializeDatabase(): Promise<void> {
  // PostgreSQL does not support CREATE DATABASE IF NOT EXISTS.
  // The configured database must exist before the application starts.
  const adminPool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: "postgres",
  });

  try {
    const result = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [env.DB_NAME],
    );

    if (result.rowCount === 0) {
      await adminPool.query(`CREATE DATABASE "${env.DB_NAME.replace(/"/g, '""')}"`);
    }

    console.log(`Database "${env.DB_NAME}" is ready`);
  } finally {
    await adminPool.end();
  }
}

export async function checkDatabaseConnection(): Promise<void> {
  const client = await db.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
