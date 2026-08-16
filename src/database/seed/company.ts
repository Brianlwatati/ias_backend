import mysql from "mysql2/promise";

import { SYSTEM_COMPANY } from "./data.js";

type DbConnection = mysql.Pool | mysql.PoolConnection | mysql.Connection;

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
      VALUES (?, ?, ?, ?, 'ACTIVE')
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
    ],
  );

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

  console.log(
    `System company ready: ${SYSTEM_COMPANY.name} (${SYSTEM_COMPANY.code})`,
  );

  return companyRow.id as number;
}
