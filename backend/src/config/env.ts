import { config as loadEnv } from "dotenv";
import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().url(),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  })
  .transform((value) => ({
    ...value,
    isProduction: value.NODE_ENV === "production",
    isTest: value.NODE_ENV === "test",
  }));

export type AppEnv = z.infer<typeof EnvSchema> & {
  isProduction: boolean;
  isTest: boolean;
};

export const createEnv = (overrides: Partial<NodeJS.ProcessEnv> = {}): AppEnv => {
  loadEnv();

  const parsed = EnvSchema.safeParse({
    ...process.env,
    ...overrides,
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
  }

  return parsed.data;
};
