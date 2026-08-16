// src/database/seed.ts

import mysql from "mysql2/promise";

import { env } from "../config/env.js";
import { hashPassword } from "../utils/password.js";

/**
 * Products and their starter roles.
 *
 * This list is only used to seed development/demo data.
 * In a real deployment, product roles should be managed
 * through the products/roles API instead of edited here.
 */
const PRODUCT_SEEDS: Array<{
  code: string;
  name: string;
  description: string;
  roles: Array<{
    code: string;
    name: string;
    description: string;
  }>;
}> = [
  {
    code: "HR",
    name: "HR System",
    description: "Human resources management",
    roles: [
      {
        code: "HR_ADMIN",
        name: "HR Admin",
        description: "Full HR access",
      },
      {
        code: "HR_USER",
        name: "HR User",
        description: "Standard HR access",
      },
    ],
  },
];

/**
 * System company.
 *
 * This is the company that owns/develops the IAS platform.
 */
const SYSTEM_COMPANY = {
  name: "Suluhi",
  code: "SUL",
  email: "brianlwatati@gmail.com",
  phone: "+254705161125",
  description: "This is the company that develops the system",
};

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
        role_scope_key,
        description
      )
      VALUES (
        NULL,
        'Super Administrator',
        'SUPER_ADMIN',
        'SYSTEM',
        'SYSTEM',
        'Full access to the authentication platform'
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        status = 'ACTIVE'
    `);

    await connection.query(`
      INSERT INTO roles (
        product_id,
        name,
        code,
        scope,
        role_scope_key,
        description
      )
      VALUES (
        NULL,
        'Company Administrator',
        'COMPANY_ADMIN',
        'SYSTEM',
        'SYSTEM',
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
          INSERT INTO products (
            code,
            name,
            description
          )
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            description = VALUES(description),
            status = 'ACTIVE'
        `,
        [productSeed.code, productSeed.name, productSeed.description],
      );

      const [productRows] = await connection.query<mysql.RowDataPacket[]>(
        `
            SELECT id
            FROM products
            WHERE code = ?
            LIMIT 1
          `,
        [productSeed.code],
      );

      const productRow = productRows[0];

      if (!productRow || productRow.id == null) {
        throw new Error(`Failed to create/find product "${productSeed.code}"`);
      }

      const productId = productRow.id as number;

      /**
       * Product-scoped roles use:
       *
       * PRODUCT:<productId>
       *
       * Example:
       * PRODUCT:1
       */
      const roleScopeKey = `PRODUCT:${productId}`;

      for (const roleSeed of productSeed.roles) {
        await connection.query(
          `
            INSERT INTO roles (
              product_id,
              name,
              code,
              scope,
              role_scope_key,
              description
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

    const systemRoleId = systemRole.id as number;

    // --------------------------------------------------
    // 4. Create system company
    // --------------------------------------------------

    await connection.query(
      `
        INSERT INTO companies (
          name,
          code,
          email,
          phone,
          status
        )
        VALUES (?, ?, ?, ?,  'ACTIVE')
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          email = VALUES(email),
          phone = VALUES(phone),
          status = 'ACTIVE'
      `,
      [
        SYSTEM_COMPANY.name,
        SYSTEM_COMPANY.code,
        SYSTEM_COMPANY.email,
        SYSTEM_COMPANY.phone,
        SYSTEM_COMPANY.description,
      ],
    );

    // --------------------------------------------------
    // 5. Find system company
    // --------------------------------------------------

    const [companyRows] = await connection.query<mysql.RowDataPacket[]>(
      `
          SELECT id
          FROM companies
          WHERE code = ?
          LIMIT 1
        `,
      [SYSTEM_COMPANY.code],
    );

    const companyRow = companyRows[0];

    if (!companyRow || companyRow.id == null) {
      throw new Error(
        `Failed to create/find system company "${SYSTEM_COMPANY.code}".`,
      );
    }

    const companyId = companyRow.id as number;

    console.log(
      `System company ready: ${SYSTEM_COMPANY.name} (${SYSTEM_COMPANY.code})`,
    );

    // --------------------------------------------------
    // 6. Check if Super Admin already exists
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

    // --------------------------------------------------
    // 7. Create Super Admin if necessary
    // --------------------------------------------------

    if (existingUsers.length === 0) {
      // Hash password only when creating the user.
      const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

      await connection.query(
        `
          INSERT INTO users (
            company_id,
            system_role_id,
            role_name,
            role_code,
            email,
            password_hash,
            first_name,
            last_name,
            status,
            email_verified_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', NOW())
        `,
        [
          companyId,
          systemRoleId,
          systemRole?.name ?? null,
          systemRole?.code ?? null,
          env.SUPER_ADMIN_EMAIL,
          passwordHash,
          env.SUPER_ADMIN_FIRST_NAME,
          env.SUPER_ADMIN_LAST_NAME,
        ],
      );

      console.log(`Super Admin created: ${env.SUPER_ADMIN_EMAIL}`);
    } else {
      // --------------------------------------------------
      // 8. Ensure existing Super Admin belongs to Suluhi
      // --------------------------------------------------

      const existingUser = existingUsers[0];

      if (!existingUser || existingUser.id == null) {
        throw new Error("Failed to retrieve existing Super Admin.");
      }

      await connection.query(
        `
          UPDATE users
          SET
            company_id = ?,
            system_role_id = ?,
            role_name = ?,
            role_code = ?
          WHERE id = ?
        `,
        [
          companyId,
          systemRoleId,
          systemRole?.name ?? null,
          systemRole?.code ?? null,
          existingUser.id,
        ],
      );

      console.log(
        `Super Admin already exists and is associated with ${SYSTEM_COMPANY.name}.`,
      );
    }

    // --------------------------------------------------
    // 9. Commit
    // --------------------------------------------------

    await connection.commit();

    console.log("Seed completed successfully.");
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
