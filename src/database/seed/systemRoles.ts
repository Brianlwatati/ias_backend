import mysql from "mysql2/promise";

type DbConnection = mysql.Pool | mysql.PoolConnection | mysql.Connection;

export async function ensureSystemRoles(
  connection: DbConnection,
): Promise<number> {
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

  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT id
      FROM roles
      WHERE code = 'SUPER_ADMIN'
        AND scope = 'SYSTEM'
        AND role_scope_key = 'SYSTEM'
      LIMIT 1
    `,
  );

  const systemRole = rows[0];

  if (!systemRole || systemRole.id == null) {
    throw new Error("Failed to create SUPER_ADMIN role.");
  }

  return systemRole.id as number;
}
