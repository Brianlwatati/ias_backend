import mysql from "mysql2/promise";

import { PRODUCT_SEEDS } from "./data.js";

type DbConnection = mysql.Pool | mysql.PoolConnection | mysql.Connection;

export async function seedProductsAndRoles(
  connection: DbConnection,
): Promise<void> {
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
        SELECT id, code
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
    const productCode = productRow.code as string;
    const roleScopeKey = `PRODUCT:${productCode}`;

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
}
