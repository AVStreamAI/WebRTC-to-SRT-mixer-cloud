import compression from "compression";
import cors from "cors";
import express from "express";
import type { IncomingMessage, ServerResponse } from "http";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { Database } from "../db/client.js";
import type { AppEnv } from "../config/env.js";
import { createHealthService } from "../app/health/service.js";
import { createHealthRouter } from "../app/health/router.js";
import { createHttpMetricsMiddleware } from "./httpMetricsMiddleware.js";
import type { Metrics } from "../observability/metrics.js";

export interface AppDependencies {
  env: AppEnv;
  logger: Logger;
  database: Database;
  metrics: Metrics;
}

export const createApp = ({ env, logger, database, metrics }: AppDependencies) => {
  const app = express();

  app.set("trust proxy", true);

  const corsOptions: cors.CorsOptions = {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.corsAllowedOrigins.includes("*") || env.corsAllowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error("CORS origin not allowed");
      (error as any).statusCode = 403;
      callback(error);
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }));

  app.use(
    pinoHttp<IncomingMessage, ServerResponse>({
      logger,
      autoLogging: {
        ignore(req) {
          return req.url === "/healthz" || req.url === env.PROMETHEUS_METRICS_PATH;
        },
      },
      serializers: {
        req(request: IncomingMessage) {
          return {
            method: request.method,
            url: request.url,
            id: (request as any).id,
          };
        },
        res(response: ServerResponse) {
          return {
            statusCode: response.statusCode,
          };
        },
      },
    }),
  );

  app.use(createHttpMetricsMiddleware(metrics));

  const healthService = createHealthService({
    database,
    logger,
    startedAt: new Date(),
  });

  app.use(createHealthRouter({ service: healthService }));

  app.get(env.PROMETHEUS_METRICS_PATH, async (_req, res, next) => {
    try {
      res.setHeader("Content-Type", metrics.registry.contentType);
      res.send(await metrics.registry.metrics());
    } catch (error) {
      next(error);
    }
  });

  app.use((req, _res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    (error as any).statusCode = 404;
    next(error);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode = error.statusCode ?? 500;
    logger.error({ err: error }, "http.request.failed");

    res.status(statusCode).json({
      error: {
        message: env.isProduction ? "Internal server error" : error.message,
        statusCode,
      },
    });
  });

  return app;
};
