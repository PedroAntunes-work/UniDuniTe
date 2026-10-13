const express = require("express");
const createParticipantsController = require("../controllers/participants.controller");

function createParticipantsRouter(service) {
  const router = express.Router();
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

module.exports = createParticipantsRouter;
