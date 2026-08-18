import { Pool } from "pg";

import { env } from "../../config/env.js";
import { ensureSystemRoles } from "./systemRoles.js";
import { seedProductsAndRoles } from "./products.js";
import { ensureSystemCompany } from "./company.js";
import { ensureSuperAdmin } from "./superAdmin.js";

async function seed() {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");

    const systemRoleId = await ensureSystemRoles(connection);
    await seedProductsAndRoles(connection);
    const companyId = await ensureSystemCompany(connection);
    await ensureSuperAdmin(connection, companyId, systemRoleId);

    await connection.query("COMMIT");
    console.log("Seed completed successfully.");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
