import { sql } from "drizzle-orm";
import type { Logger } from "pino";
import type { Database } from "../../db/client.js";

export type ComponentStatus = "pass" | "fail";

export interface HealthComponent {
  status: ComponentStatus;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: "ok" | "degraded" | "error";
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    database: HealthComponent;
  };
}

export interface HealthService {
  check(): Promise<HealthReport>;
}

interface HealthServiceDependencies {
  database: Database;
  logger: Logger;
  startedAt: Date;
}

export const createHealthService = ({
  database,
  logger,
  startedAt,
}: HealthServiceDependencies): HealthService => {
  const checkDatabase = async (): Promise<HealthComponent> => {
    const start = process.hrtime.bigint();

    try {
      await database.execute(sql`select 1`);
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1_000_000;

      return {
        status: "pass",
        latencyMs,
      };
    } catch (error) {
      logger.error({ err: error }, "health.database.failed");
      return {
        status: "fail",
        error: error instanceof Error ? error.message : "Unknown database error",
      };
    }
  };

  const computeStatus = (checks: HealthReport["checks"]): HealthReport["status"] => {
    if (checks.database.status === "fail") {
      return "error";
    }

    return "ok";
  };

  return {
    async check() {
      const checks = {
        database: await checkDatabase(),
      } as const;

      return {
        status: computeStatus(checks),
        uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
        timestamp: new Date().toISOString(),
        checks,
      };
    },
  };
};
