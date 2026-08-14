// src/database/seed.ts

import mysql from "mysql2/promise";

import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";

/**
 * Products and their starter roles.
 *
 * This list is only used to seed development/demo data.
 * In a real deployment, product roles should be managed
 * through the products/roles API instead of edited here —
 * this exists purely to unblock local testing before that
 * module exists.
 */
const PRODUCT_SEEDS: Array<{
  code: string;
  name: string;
  description: string;
  roles: Array<{ code: string; name: string; description: string }>;
}> = [
  {
    code: "HR",
    name: "HR System",
    description: "Human resources management",
    roles: [
      { code: "HR_ADMIN", name: "HR Admin", description: "Full HR access" },
      { code: "HR_USER", name: "HR User", description: "Standard HR access" },
    ],
  },
];

async function seed() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  try {
    await connection.beginTransaction();

    // --------------------------------------------------
    // 1. Create system roles
    // --------------------------------------------------

    await connection.query(`
      INSERT INTO roles (
        product_id, name, code, scope, role_scope_key, description
      )
      VALUES (
        NULL, 'Super Administrator', 'SUPER_ADMIN', 'SYSTEM', 'SYSTEM',
        'Full access to the authentication platform'
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        status = 'ACTIVE'
    `);

    await connection.query(`
      INSERT INTO roles (
        product_id, name, code, scope, role_scope_key, description
      )
      VALUES (
        NULL, 'Company Administrator', 'COMPANY_ADMIN', 'SYSTEM', 'SYSTEM',
        'Administrator of a company'
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        status = 'ACTIVE'
    `);

    // --------------------------------------------------
    // 2. Create demo products and their roles
    // --------------------------------------------------

    for (const productSeed of PRODUCT_SEEDS) {
      await connection.query(
        `
          INSERT INTO products (code, name, description)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            status = 'ACTIVE'
        `,
        [productSeed.code, productSeed.name, productSeed.description],
      );

      const [productRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT id FROM products WHERE code = ? LIMIT 1`,
        [productSeed.code],
      );

      const productRow = productRows[0];

      if (!productRow || productRow.id == null) {
        throw new Error(`Failed to create/find product "${productSeed.code}"`);
      }

      const productId = productRow.id as number;
      const roleScopeKey = `PRODUCT:${productId}`;

      for (const roleSeed of productSeed.roles) {
        await connection.query(
          `
            INSERT INTO roles (
              product_id, name, code, scope, role_scope_key, description
            )
            VALUES (?, ?, ?, 'PRODUCT', ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              description = VALUES(description),
              status = 'ACTIVE'
          `,
          [
            productId,
            roleSeed.name,
            roleSeed.code,
            roleScopeKey,
            roleSeed.description,
          ],
        );
      }
    }

    // --------------------------------------------------
    // 3. Find SUPER_ADMIN role
    // --------------------------------------------------

    const [roles] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM roles
        WHERE code = 'SUPER_ADMIN'
          AND scope = 'SYSTEM'
          AND role_scope_key = 'SYSTEM'
        LIMIT 1
      `,
    );

    if (roles.length === 0) {
      throw new Error("Failed to create SUPER_ADMIN role.");
    }

    const systemRole = roles[0];

    if (!systemRole || systemRole.id == null) {
      throw new Error("Failed to retrieve SUPER_ADMIN role ID.");
    }

    const systemRoleId = systemRole.id;

    // --------------------------------------------------
    // 4. Check if Super Admin already exists
    // --------------------------------------------------

    const [existingUsers] = await connection.query<mysql.RowDataPacket[]>(
      `
        SELECT id
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [env.SUPER_ADMIN_EMAIL],
    );

    if (existingUsers.length > 0) {
      console.log(`Super Admin already exists: ${env.SUPER_ADMIN_EMAIL}`);

      await connection.commit();
      return;
    }

    // --------------------------------------------------
    // 5. Hash password
    // --------------------------------------------------

    const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

    // --------------------------------------------------
    // 6. Create Super Admin
    // --------------------------------------------------

    await connection.query(
      `
        INSERT INTO users (
          company_id, system_role_id, email, password_hash,
          first_name, last_name, status, email_verified_at
        )
        VALUES (NULL, ?, ?, ?, ?, ?, 'ACTIVE', NOW())
      `,
      [
        systemRoleId,
        env.SUPER_ADMIN_EMAIL,
        passwordHash,
        env.SUPER_ADMIN_FIRST_NAME,
        env.SUPER_ADMIN_LAST_NAME,
      ],
    );

    await connection.commit();

    console.log(`Super Admin created: ${env.SUPER_ADMIN_EMAIL}`);
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);

  process.exit(1);
});
