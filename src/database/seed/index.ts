import mysql from "mysql2/promise";

import { env } from "../../config/env.js";
import { ensureSystemRoles } from "./systemRoles.js";
import { seedProductsAndRoles } from "./products.js";
import { ensureSystemCompany } from "./company.js";
import { ensureSuperAdmin } from "./superAdmin.js";

async function seed() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  try {
    await connection.beginTransaction();

    const systemRoleId = await ensureSystemRoles(connection);
    await seedProductsAndRoles(connection);
    const companyId = await ensureSystemCompany(connection);

    await ensureSuperAdmin(connection, companyId, systemRoleId);

    await connection.commit();
    console.log("Seed completed successfully.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
