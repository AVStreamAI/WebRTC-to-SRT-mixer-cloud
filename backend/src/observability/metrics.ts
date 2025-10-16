import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

export interface MetricsOptions {
  prefix?: string;
}

export interface Metrics {
  registry: Registry;
  httpRequestDuration: Histogram<string>;
  httpRequestErrors: Counter<string>;
}

export const createMetrics = ({ prefix }: MetricsOptions = {}): Metrics => {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix });

  const httpRequestDuration = new Histogram({
    name: `${prefix ?? ""}http_request_duration_seconds`,
    help: "HTTP request duration histogram",
    labelNames: ["method", "status_code", "route"],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    registers: [registry],
  });

  const httpRequestErrors = new Counter({
    name: `${prefix ?? ""}http_request_errors_total`,
    help: "Total number of HTTP requests that resulted in errors",
    labelNames: ["method", "route", "status_code"],
    registers: [registry],
  });

  return {
    registry,
    httpRequestDuration,
    httpRequestErrors,
  };
};
