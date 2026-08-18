import type { Pool, PoolClient } from "pg";

type DbConnection = Pool | PoolClient;

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
    ON CONFLICT (role_scope_key, code) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
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
    ON CONFLICT (role_scope_key, code) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          status = 'ACTIVE'
  `);

  const { rows: rows } = await connection.query<Record<string, any>>(
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
