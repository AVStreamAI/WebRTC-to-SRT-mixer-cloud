import type { RequestHandler } from "express";
import onFinished from "on-finished";
import type { Metrics } from "../observability/metrics.js";

const resolveRouteLabel = (req: Parameters<RequestHandler>[0]): string => {
  return req.route?.path ?? req.originalUrl ?? req.path;
};

export const createHttpMetricsMiddleware = (metrics: Metrics): RequestHandler => {
  return (req, res, next) => {
    const routeLabel = resolveRouteLabel(req);
    const end = metrics.httpRequestDuration.startTimer({
      method: req.method,
      route: routeLabel,
    });

    onFinished(res, () => {
      const finalRouteLabel = resolveRouteLabel(req);
      end({
        method: req.method,
        route: finalRouteLabel,
        status_code: res.statusCode,
      });

      if (res.statusCode >= 500) {
        metrics.httpRequestErrors.inc({
          method: req.method,
          route: finalRouteLabel,
          status_code: res.statusCode,
        });
      }
    });

    next();
  };
};
