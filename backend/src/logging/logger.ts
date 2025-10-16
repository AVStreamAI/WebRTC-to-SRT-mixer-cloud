import { pino } from "pino";
import type { Logger, LoggerOptions } from "pino";

type CreateLoggerOptions = LoggerOptions;

export const createLogger = (options: CreateLoggerOptions = {}): Logger => {
  const baseLogger = pino({
    level: options.level ?? "info",
    ...options,
    formatters: {
      level(label: string) {
        return { level: label };
      },
      ...options.formatters,
    },
    redact: options.redact ?? {
      paths: ["req.headers.authorization", "password", "passhash", "token"],
      censor: "***",
    },
  } as LoggerOptions);

  return baseLogger;
};
