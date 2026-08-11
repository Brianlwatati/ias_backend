import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

import { env } from "../config/env.js";

const migrationsDirectory = path.join(__dirname, "migrations");

async function migrate() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  try {
    // Create migration tracking table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        migration VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (id),
        UNIQUE KEY uq_migrations_migration (migration)
      ) ENGINE=InnoDB;
    `);

    // Get already executed migrations
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT migration FROM migrations`,
    );

    const executedMigrations = new Set(rows.map((row) => row.migration));

    // Read migration files
    const files = await fs.readdir(migrationsDirectory);

    const migrations = files.filter((file) => file.endsWith(".sql")).sort();

    // Execute migrations in order
    for (const migration of migrations) {
      if (executedMigrations.has(migration)) {
        continue;
      }

      console.log(`Running migration: ${migration}`);

      const filePath = path.join(migrationsDirectory, migration);

      const sql = await fs.readFile(filePath, "utf8");

      // Split migration into individual SQL statements
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter(Boolean);

      await connection.beginTransaction();

      try {
        for (const statement of statements) {
          await connection.query(statement);
        }

        // Mark migration as completed only after
        // every statement succeeds.
        await connection.query(
          `
            INSERT INTO migrations (migration)
            VALUES (?)
          `,
          [migration],
        );

        await connection.commit();

        console.log(`Completed migration: ${migration}`);
      } catch (error) {
        await connection.rollback();

        console.error(`Migration failed: ${migration}`);

        throw error;
      }
    }

    console.log("All migrations completed.");
  } finally {
    await connection.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
