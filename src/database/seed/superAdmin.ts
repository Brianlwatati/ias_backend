import mysql from "mysql2/promise";

import { env } from "../../config/env.js";
import { hashPassword } from "../../utils/password.js";

type DbConnection = mysql.Pool | mysql.PoolConnection | mysql.Connection;

export async function ensureSuperAdmin(
  connection: DbConnection,
  companyId: number,
  systemRoleId: number,
): Promise<void> {
  const [existingUsers] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM users
      WHERE email = ?
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
        VALUES (?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, 'ACTIVE', NOW())
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
        company_id = ?,
        system_role_id = ?,
        role_name = ?,
        role_code = ?
      WHERE id = ?
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
