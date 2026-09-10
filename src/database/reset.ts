import { db } from "../config/database.js";
import { env } from "../config/env.js";

async function resetDatabase(): Promise<void> {
  if (env.NODE_ENV === "production") {
    throw new Error("Database reset is disabled when NODE_ENV=production");
  }

  const client = await db.connect();

  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    console.log("Database schema reset successfully.");
  } finally {
    client.release();
    await db.end();
  }
}

resetDatabase().catch((error) => {
  console.error("Database reset failed:", error);
  process.exit(1);
});
