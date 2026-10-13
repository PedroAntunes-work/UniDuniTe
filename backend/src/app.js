const path = require("node:path");
const express = require("express");
const cors = require("cors");
const ParticipantsRepository = require("./repositories/participants.repository");
const ParticipantsService = require("./services/participants.service");
const createParticipantsRouter = require("./routes/participants.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/error-handler");

function createApp(options = {}) {
  const databasePath = options.databasePath ?? path.join(__dirname, "..", "db", "participants.json");
  const repository = options.repository ?? new ParticipantsRepository(databasePath);
  const service = new ParticipantsService(repository);
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: options.corsOrigin ?? process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
  app.use(express.json({ limit: "16kb" }));
  app.get("/api/health", (_request, response) => response.status(200).json({ status: "ok" }));
  app.use("/api/participants", createParticipantsRouter(service));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
