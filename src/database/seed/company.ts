import type { Pool, PoolClient } from "pg";

import { SYSTEM_COMPANY } from "./data.js";

type DbConnection = Pool | PoolClient;

export async function ensureSystemCompany(
  connection: DbConnection,
): Promise<number> {
  await connection.query(
    `
      INSERT INTO companies (
        name,
        code,
        email,
        phone,
        status
      )
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      ON CONFLICT (code) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            status = 'ACTIVE'
    `,
    [
      SYSTEM_COMPANY.name,
      SYSTEM_COMPANY.code,
      SYSTEM_COMPANY.email,
      SYSTEM_COMPANY.phone,
    ],
  );

  const { rows: companyRows } = await connection.query<Record<string, any>>(
    `
      SELECT id
      FROM companies
      WHERE code = $1
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

  console.log(
    `System company ready: ${SYSTEM_COMPANY.name} (${SYSTEM_COMPANY.code})`,
  );

  return companyRow.id as number;
}
