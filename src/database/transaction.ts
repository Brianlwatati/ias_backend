// src/database/transaction.ts

import type { Pool, PoolClient } from "pg";

export async function withTransaction<T>(
  pool: Pool,
  callback: (connection: PoolClient) => Promise<T>,
): Promise<T> {
  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");

    const result = await callback(connection);

    await connection.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await connection.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Rollback failed after error:", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}
