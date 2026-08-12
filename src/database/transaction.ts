import mysql from "mysql2/promise";

export async function withTransaction<T>(
  pool: mysql.Pool,
  callback: (connection: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await callback(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}
