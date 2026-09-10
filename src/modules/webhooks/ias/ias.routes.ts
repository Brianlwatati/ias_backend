import { Router } from "express";
import type { Pool } from "pg";
import { authenticateIasWebhook } from "../../../middleware/authenticateIasWebhook.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import { IasWebhookController } from "./ias.controller.js";
import { IasWebhookRepository } from "./ias.repository.js";
import { IasWebhookService } from "./ias.service.js";
import {
  companyProvisionedSchema,
  userCreatedSchema,
} from "./ias.validation.js";

export function createIasWebhookRouter(db: Pool): Router {
  const router = Router();
  const controller = new IasWebhookController(
    new IasWebhookService(db, new IasWebhookRepository()),
  );

  router.use(authenticateIasWebhook);
  router.get("/ping", controller.ping);
  router.post("/ping", controller.ping);
  router.post(
    "/company-provisioned",
    validateRequest(companyProvisionedSchema),
    controller.companyProvisioned,
  );
  router.post(
    "/user-created",
    validateRequest(userCreatedSchema),
    controller.userCreated,
  );

  return router;
}
