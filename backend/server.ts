import http from "node:http";
import process from "node:process";
import { createApp } from "./src/server/app.js";
import { createEnv } from "./src/config/env.js";
import { createLogger } from "./src/logging/logger.js";
import { createDatabase } from "./src/db/client.js";
import { createMetrics } from "./src/observability/metrics.js";

const env = createEnv();
const logger = createLogger({ level: env.LOG_LEVEL });
const databaseClient = createDatabase({
  connectionString: env.DATABASE_URL,
  logger,
});

const metrics = createMetrics({ prefix: "mixer_" });

const app = createApp({
  env,
  logger,
  database: databaseClient.db,
  metrics,
});

const server = http.createServer(app);

const start = async () => {
  return new Promise<void>((resolve) => {
    server.listen(env.API_PORT, env.API_HOST, () => {
      logger.info(
        { host: env.API_HOST, port: env.API_PORT },
        "api.http.started",
      );
      resolve();
    });
  });
};

const shutdown = async (signal: NodeJS.Signals) => {
  logger.info({ signal }, "api.shutdown.initiated");

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await databaseClient.dispose();

  logger.info({ signal }, "api.shutdown.completed");
};

start().catch((error) => {
  logger.fatal({ err: error }, "api.http.start_failed");
  process.exitCode = 1;
});

const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
signals.forEach((signal) => {
  process.once(signal, () => {
    shutdown(signal).catch((error) => {
      logger.fatal({ err: error }, "api.shutdown.failed");
      process.exitCode = 1;
    });
  });
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "api.uncaught_exception");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "api.unhandled_rejection");
});
