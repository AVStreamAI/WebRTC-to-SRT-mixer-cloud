import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
