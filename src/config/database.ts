// src/config/database.ts

import { Pool, types } from "pg";
import { env } from "./env.js";

// PostgreSQL returns BIGINT (OID 20) as strings by default. The application
// models IDs as numbers, so parse BIGINT values as JavaScript numbers.
types.setTypeParser(20, (value) => Number.parseInt(value, 10));

const usingManagedProvider = Boolean(env.DATABASE_URL);

// Render, Railway, Neon, etc. all require SSL on external
// connections and hand out certs that Node's default CA bundle
// won't recognize — rejectUnauthorized: false accepts that,
// which is the standard tradeoff for these providers (the
// connection is still encrypted, it just isn't verifying the
// server's cert chain). Swap this for a proper CA bundle if you
// need stricter guarantees.
const sslConfig =
  usingManagedProvider || env.DB_SSL
    ? { rejectUnauthorized: false }
    : undefined;

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: sslConfig,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: sslConfig,
    };

export const db = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  options: "-c timezone=UTC",
});

export async function initializeDatabase(): Promise<void> {
  // Managed providers (Render included) provision the database for
  // you up front and generally don't grant your user permission to
  // connect to the "postgres" maintenance database or run CREATE
  // DATABASE — so there's nothing to do here except confirm the
  // connection actually works.
  if (usingManagedProvider) {
    await checkDatabaseConnection();
    console.log("Connected to managed Postgres database");
    return;
  }

  // PostgreSQL does not support CREATE DATABASE IF NOT EXISTS.
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
      await adminPool.query(`CREATE DATABASE "${env.DB_NAME!.replace(/"/g, '""')}"`);
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
