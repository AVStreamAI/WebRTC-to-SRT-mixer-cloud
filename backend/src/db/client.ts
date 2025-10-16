import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { Logger } from "pino";
import * as schema from "./schema.js";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseDependencies {
  connectionString: string;
  logger?: Logger;
}

export interface DatabaseClient {
  db: Database;
  pool: Pool;
  dispose: () => Promise<void>;
}

export const createDatabase = ({
  connectionString,
  logger,
}: DatabaseDependencies): DatabaseClient => {
  const pool = new Pool({ connectionString });

  pool.on("error", (error: Error) => {
    logger?.error({ err: error }, "PostgreSQL pool error");
  });

  const db = drizzle(pool, {
    schema,
    logger: logger
      ? {
          logQuery(query, params) {
            logger.debug({ query, params }, "db.query");
          },
        }
      : undefined,
  });

  return {
    db,
    pool,
    dispose: async () => {
      await pool.end();
    },
  };
};

export * from "./schema.js";
