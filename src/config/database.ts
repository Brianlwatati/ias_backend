// src/config/database.ts

import mysql from "mysql2/promise";
import { env } from "./env.js";

const databaseName = env.DB_NAME;

export const db = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  timezone: "Z",
});

export async function initializeDatabase(): Promise<void> {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  });

  try {
    await connection.query(
      `
            CREATE DATABASE IF NOT EXISTS \`${databaseName}\`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_0900_ai_ci
            `,
    );

    console.log(`Database "${databaseName}" is ready`);
  } finally {
    await connection.end();
  }
}

export async function checkDatabaseConnection(): Promise<void> {
  const connection = await db.getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
