import type { Pool, PoolClient } from "pg";

import { PRODUCT_SEEDS } from "./data.js";

type DbConnection = Pool | PoolClient;

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
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO UPDATE
          SET name = EXCLUDED.name,
              description = EXCLUDED.description,
              status = 'ACTIVE'
      `,
      [productSeed.code, productSeed.name, productSeed.description],
    );

    const { rows: productRows } = await connection.query<Record<string, any>>(
      `
        SELECT id, code
        FROM products
        WHERE code = $1
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
          VALUES ($1, $2, $3, 'PRODUCT', $4, $5)
          ON CONFLICT (role_scope_key, code) DO UPDATE
            SET name = EXCLUDED.name,
                description = EXCLUDED.description,
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
