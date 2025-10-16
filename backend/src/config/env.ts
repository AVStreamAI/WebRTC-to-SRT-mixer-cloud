import { config as loadEnv } from "dotenv";
import { z } from "zod";

const RawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  API_PORT: z.coerce.number().int().positive().default(8080),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  REQUEST_BODY_LIMIT: z.string().default("1mb"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  MEDIA_MTX_ENDPOINT: z.string().url().default("http://mediamtx:9997"),
  MINIO_ENDPOINT: z.string().url().default("http://minio:9000"),
  MINIO_ACCESS_KEY: z.string().default("minioadmin"),
  MINIO_SECRET_KEY: z.string().default("minioadmin"),
  MINIO_BUCKET: z.string().default("mixer"),
  PROMETHEUS_METRICS_PATH: z.string().default("/metrics"),
});

const normalizeOrigins = (rawOrigins: string | undefined): string[] => {
  if (!rawOrigins || rawOrigins.trim().length === 0) {
    return ["http://localhost:5173"];
  }

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export type AppEnv = z.infer<typeof RawEnvSchema> & {
  isProduction: boolean;
  isTest: boolean;
  corsAllowedOrigins: string[];
};

export const createEnv = (overrides: Partial<NodeJS.ProcessEnv> = {}): AppEnv => {
  loadEnv();

  const parsed = RawEnvSchema.safeParse({
    ...process.env,
    ...overrides,
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }

  const baseEnv = parsed.data;

  return {
    ...baseEnv,
    corsAllowedOrigins: normalizeOrigins(baseEnv.CORS_ALLOWED_ORIGINS),
    isProduction: baseEnv.NODE_ENV === "production",
    isTest: baseEnv.NODE_ENV === "test",
  };
};
