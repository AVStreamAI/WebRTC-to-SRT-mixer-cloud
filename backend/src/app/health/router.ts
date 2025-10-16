import { Router } from "express";
import type { HealthService } from "./service.js";

export interface HealthRouterDependencies {
  service: HealthService;
}

export const createHealthRouter = ({ service }: HealthRouterDependencies) => {
  const router = Router();

  router.get("/healthz", async (_req, res, next) => {
    try {
      const report = await service.check();
      const statusCode = report.status === "ok" ? 200 : 503;
      res.status(statusCode).json(report);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
