import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createEnv } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import { createDatabase } from "./client.js";

const env = createEnv();
const logger = createLogger({ level: env.LOG_LEVEL });

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);

async function run() {
  const database = createDatabase({
    connectionString: env.DATABASE_URL,
    logger,
  });

  try {
    await migrate(database.db, { migrationsFolder });
    logger.info("Database migrations executed successfully");
  } catch (error) {
    logger.error({ err: error }, "Database migration failed");
    process.exitCode = 1;
  } finally {
    await database.dispose();
  }
}

run().catch((error) => {
  logger.error({ err: error }, "Unexpected migration failure");
  process.exitCode = 1;
});
