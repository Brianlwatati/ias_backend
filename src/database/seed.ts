import mysql from "mysql2/promise";

import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";

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
                product_id,
                name,
                code,
                scope,
                description
            )
            SELECT
                NULL,
                'Super Administrator',
                'SUPER_ADMIN',
                'SYSTEM',
                'Full access to the authentication platform'
            WHERE NOT EXISTS (
                SELECT 1
                FROM roles
                WHERE code = 'SUPER_ADMIN'
                  AND scope = 'SYSTEM'
            )
        `);

    await connection.query(`
            INSERT INTO roles (
                product_id,
                name,
                code,
                scope,
                description
            )
            SELECT
                NULL,
                'Company Administrator',
                'COMPANY_ADMIN',
                'SYSTEM',
                'Administrator of a company'
            WHERE NOT EXISTS (
                SELECT 1
                FROM roles
                WHERE code = 'COMPANY_ADMIN'
                  AND scope = 'SYSTEM'
            )
        `);

    // --------------------------------------------------
    // 2. Find SUPER_ADMIN role
    // --------------------------------------------------

    const [roles] = await connection.query<mysql.RowDataPacket[]>(
      `
                SELECT id
                FROM roles
                WHERE code = 'SUPER_ADMIN'
                  AND scope = 'SYSTEM'
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
    // 3. Check if Super Admin already exists
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

      await connection.rollback();
      return;
    }

    // --------------------------------------------------
    // 4. Hash password
    // --------------------------------------------------

    const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

    // --------------------------------------------------
    // 5. Create Super Admin
    // --------------------------------------------------

    await connection.query(
      `
            INSERT INTO users (
                company_id,
                system_role_id,
                email,
                password_hash,
                first_name,
                last_name,
                status,
                email_verified_at
            )
            VALUES (
                NULL,
                ?,
                ?,
                ?,
                ?,
                ?,
                'ACTIVE',
                NOW()
            )
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
