import { app } from "./app.js";
import { env } from "./config/env.js";
import {
  initializeDatabase,
  checkDatabaseConnection,
} from "./config/database.js";

async function bootstrap() {
  try {
    await initializeDatabase();
    await checkDatabaseConnection();

    console.log("Database connection established");

    app.listen(env.PORT, () => {
      console.log(`Auth service running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
