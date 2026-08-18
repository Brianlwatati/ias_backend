import type { Pool, PoolClient } from "pg";

import { env } from "../../config/env.js";
import { hashPassword } from "../../utils/password.js";

type DbConnection = Pool | PoolClient;

export async function ensureSuperAdmin(
  connection: DbConnection,
  companyId: number,
  systemRoleId: number,
): Promise<void> {
  const { rows: existingUsers } = await connection.query<Record<string, any>>(
    `
      SELECT id
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [env.SUPER_ADMIN_EMAIL],
  );

  if (existingUsers.length === 0) {
    const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

    await connection.query(
      `
        INSERT INTO users (
          company_id,
          system_role_id,
          role_name,
          role_code,
          role_scope,
          role_scope_key,
          email,
          phone,
          password_hash,
          first_name,
          last_name,
          status,
          email_verified_at
        )
        VALUES ($1, $2, $3, $4, $5,$6,$7, $8, $9, $10, $11, 'ACTIVE', NOW())
      `,
      [
        companyId,
        systemRoleId,
        "Super Administrator",
        "SUPER_ADMIN",
        "SUPER_ADMIN_SCOPE",
        "SUPER_ADMIN_SCOPE_KEY",
        env.SUPER_ADMIN_EMAIL,
        env.SUPER_ADMIN_PHONE,
        passwordHash,
        env.SUPER_ADMIN_FIRST_NAME,
        env.SUPER_ADMIN_LAST_NAME,
      ],
    );

    console.log(`Super Admin created: ${env.SUPER_ADMIN_EMAIL}`);
    return;
  }

  const existingUser = existingUsers[0];

  if (!existingUser || existingUser.id == null) {
    throw new Error("Failed to retrieve existing Super Admin.");
  }

  await connection.query(
    `
      UPDATE users
      SET
        company_id = $1,
        system_role_id = $2,
        role_name = $3,
        role_code = $4
      WHERE id = $5
    `,
    [
      companyId,
      systemRoleId,
      "Super Administrator",
      "SUPER_ADMIN",
      existingUser.id,
    ],
  );

  console.log(
    `Super Admin already exists and is associated with the system company.`,
  );
}
