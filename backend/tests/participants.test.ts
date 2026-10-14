import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import express, { type Express } from "express";
import Database from "better-sqlite3";
import request from "supertest";
import createApp from "../src/app";
import { ParticipantsRepository } from "../src/repositories/participants.repository";
import type { Participant, ParticipantsRepositoryContract } from "../src/types/participants";

const seed: Participant[] = [
  { id: 1, name: "Ana" },
  { id: 2, name: "Pedro" },
];

let directory = "";
let databasePath = "";
let legacyFilePath = "";
let app: Express = express();
let repository: ParticipantsRepository | null = null;

beforeEach(async (): Promise<void> => {
  directory = await mkdtemp(path.join(os.tmpdir(), "unidunite-"));
  databasePath = path.join(directory, "participants.sqlite");
  legacyFilePath = path.join(directory, "participants.json");
  await writeFile(legacyFilePath, JSON.stringify(seed), "utf8");
  repository = new ParticipantsRepository(databasePath, legacyFilePath);
  app = createApp({ repository });
});

afterEach(async (): Promise<void> => {
  repository?.close();
  repository = null;
  await rm(directory, { recursive: true, force: true });
});

function readParticipants(): Participant[] {
  const database = new Database(databasePath);
  try {
    return database
      .prepare("SELECT id, name FROM participants ORDER BY id")
      .all() as Participant[];
  } finally {
    database.close();
  }
}

test("lists and finds participants", async (): Promise<void> => {
  const list = await request(app).get("/api/participants").expect(200);
  expect(list.body).toEqual(seed);
  const item = await request(app).get("/api/participants/2").expect(200);
  expect(item.body).toEqual(seed[1]);
});

test("imports valid names in one operation and reports rejected names", async (): Promise<void> => {
  const response = await request(app)
    .post("/api/participants/import")
    .send({ names: [" Bia ", "ANA", "Bia", "", "x".repeat(101)] })
    .expect(201);
  expect(response.body.created).toEqual([{ id: 3, name: "Bia" }]);
  expect(response.body.rejected.map(({ code }: { code: string }) => code)).toEqual([
    "ALREADY_REGISTERED",
    "DUPLICATE_IN_IMPORT",
    "EMPTY_NAME",
    "NAME_TOO_LONG",
  ]);
  expect(readParticipants()).toHaveLength(3);
});

test("migrates the legacy JSON only once without deleting it", async (): Promise<void> => {
  expect(readParticipants()).toEqual(seed);
  repository?.close();
  await writeFile(legacyFilePath, JSON.stringify([{ id: 99, name: "Outro" }]), "utf8");
  repository = new ParticipantsRepository(databasePath, legacyFilePath);
  expect(repository.findAll()).toEqual(seed);
  expect(await readFile(legacyFilePath, "utf8")).toContain('"Outro"');
});

test.each([
  [{ names: ["Ana"] }, 422, "IMPORT_EMPTY_RESULT"],
  [{ names: ["", "x".repeat(101)] }, 422, "IMPORT_EMPTY_RESULT"],
  [{ names: "Ana" }, 400, "INVALID_IMPORT_BODY"],
  [{ names: ["Bia"], extra: true }, 400, "UNKNOWN_FIELDS"],
  [{ names: [null, 42] }, 422, "IMPORT_EMPTY_RESULT"],
])(
  "validates participant imports",
  async (body: unknown, status: number, code: string): Promise<void> => {
    const serializedBody = JSON.stringify(body);
    const response = await request(app)
      .post("/api/participants/import")
      .set("Content-Type", "application/json")
      .send(serializedBody)
      .expect(status);
    expect(response.body.error.code).toBe(code);
  },
);

test("creates and persists a participant with a new ID", async (): Promise<void> => {
  const response = await request(app)
    .post("/api/participants")
    .send({ name: "  Sofia  " })
    .expect("Location", "/api/participants/3")
    .expect(201);
  expect(response.body).toEqual({ id: 3, name: "Sofia" });
  expect(readParticipants()).toContainEqual(response.body);
});

test("keeps normalized names unique when requests race", async (): Promise<void> => {
  const responses = await Promise.all([
    request(app).post("/api/participants").send({ name: "Duda" }),
    request(app).post("/api/participants").send({ name: "DUDA" }),
  ]);
  expect(responses.map(({ status }) => status).sort()).toEqual([201, 409]);
  expect(readParticipants().filter(({ name }) => name.toLowerCase() === "duda")).toHaveLength(1);
});

test("replaces and patches a participant", async (): Promise<void> => {
  await request(app)
    .put("/api/participants/1")
    .send({ name: "Beatriz" })
    .expect(200, { id: 1, name: "Beatriz" });
  await request(app)
    .patch("/api/participants/1")
    .send({ name: "Clara" })
    .expect(200, { id: 1, name: "Clara" });
  const saved = readParticipants();
  expect(saved[0]).toEqual({ id: 1, name: "Clara" });
});

test("deletes a participant and returns no content", async (): Promise<void> => {
  await request(app).delete("/api/participants/1").expect(204);
  await request(app).get("/api/participants/1").expect(404);
});

type RequestMethod = "get" | "post" | "patch";
const structuredErrorCases: Array<[string, RequestMethod, string, unknown, number, string]> = [
  ["invalid ID", "get", "/api/participants/nope", undefined, 400, "INVALID_ID"],
  ["missing participant", "get", "/api/participants/99", undefined, 404, "PARTICIPANT_NOT_FOUND"],
  ["missing name", "post", "/api/participants", {}, 422, "NAME_REQUIRED"],
  ["invalid name", "post", "/api/participants", { name: 12 }, 422, "INVALID_NAME"],
  ["unknown field", "post", "/api/participants", { name: "Luís", admin: true }, 400, "UNKNOWN_FIELDS"],
  ["invalid body", "post", "/api/participants", [], 400, "INVALID_BODY"],
  ["duplicate name", "post", "/api/participants", { name: "  ANA " }, 409, "DUPLICATE_NAME"],
  ["empty patch", "patch", "/api/participants/1", {}, 422, "NAME_REQUIRED"],
];

test.each(structuredErrorCases)(
  "returns a structured error for %s",
  async (
    _label: string,
    method: "get" | "post" | "patch",
    url: string,
    body: unknown,
    status: number,
    code: string,
  ): Promise<void> => {
    const operation = request(app)[method](url);
    if (body !== undefined) {
      const serializedBody = JSON.stringify(body);
      if (serializedBody !== undefined) {
        operation.set("Content-Type", "application/json").send(serializedBody);
      }
    }
    const response = await operation.expect(status);
    expect(response.body.error).toEqual(expect.objectContaining({ code, message: expect.any(String) }));
  },
);

test("rejects malformed JSON and unknown routes", async (): Promise<void> => {
  const malformed = await request(app)
    .post("/api/participants")
    .set("Content-Type", "application/json")
    .send('{"name":')
    .expect(400);
  expect(malformed.body.error.code).toBe("MALFORMED_JSON");
  const missingRoute = await request(app).get("/api/nope").expect(404);
  expect(missingRoute.body.error.code).toBe("ROUTE_NOT_FOUND");
});

test("returns a controlled error when persistence fails", async (): Promise<void> => {
  const failingRepository: ParticipantsRepositoryContract = {
    findAll: jest.fn(() => []),
    findById: jest.fn(() => null),
    create: jest.fn(() => {
      throw new Error("disk failed");
    }),
    import: jest.fn(() => []),
    update: jest.fn(() => null),
    delete: jest.fn(() => false),
  };
  const response = await request(createApp({ repository: failingRepository }))
    .post("/api/participants")
    .send({ name: "Sofia" })
    .expect(500);
  expect(response.body).toEqual({
    error: { code: "INTERNAL_ERROR", message: "Ocorreu um erro interno." },
  });
});
