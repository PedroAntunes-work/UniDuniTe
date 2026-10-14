import { Router } from "express";
import type { ParticipantsService } from "../services/participants.service";
import { createParticipantsController } from "../controllers/participants.controller";

export function createParticipantsRouter(service: ParticipantsService): Router {
  const router = Router();
  const controller = createParticipantsController(service);

  router.get("/", controller.list);
  router.post("/import", controller.import);
  router.get("/:id", controller.get);
  router.post("/", controller.create);
  router.put("/:id", controller.replace);
  router.patch("/:id", controller.patch);
  router.delete("/:id", controller.remove);

  return router;
}
