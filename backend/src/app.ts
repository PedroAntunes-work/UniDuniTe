import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import { ParticipantsRepository } from "./repositories/participants.repository";
import { ParticipantsService } from "./services/participants.service";
import { createParticipantsRouter } from "./routes/participants.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";
import type { ParticipantsRepositoryContract } from "./types/participants";

interface AppOptions {
  databasePath?: string;
  legacyFilePath?: string;
  repository?: ParticipantsRepositoryContract;
  corsOrigin?: string;
}

export default function createApp(options: AppOptions = {}): Express {
  const databasePath =
    options.databasePath ??
    (process.env.DATABASE_PATH
      ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
      : path.join(__dirname, "..", "db", "participants.sqlite"));
  const legacyFilePath = options.legacyFilePath ?? path.join(__dirname, "..", "db", "participants.json");
  const repository = options.repository ?? new ParticipantsRepository(databasePath, legacyFilePath);
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
