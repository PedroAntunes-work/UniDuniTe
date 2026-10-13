const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const request = require("supertest");
const createApp = require("../src/app");

const seed = [
  { id: 1, name: "Ana" },
  { id: 2, name: "Pedro" },
];

let directory;
let databasePath;
let app;

beforeEach(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "unidunite-"));
  databasePath = path.join(directory, "participants.json");
  await fs.writeFile(databasePath, JSON.stringify(seed), "utf8");
  app = createApp({ databasePath });
});

afterEach(async () => {
  await fs.rm(directory, { recursive: true, force: true });
});

test("lists and finds participants", async () => {
  const list = await request(app).get("/api/participants").expect(200);
  expect(list.body).toEqual(seed);
  const item = await request(app).get("/api/participants/2").expect(200);
  expect(item.body).toEqual(seed[1]);
});

test("imports valid names in one operation and reports rejected names", async () => {
  const response = await request(app)
    .post("/api/participants/import")
    .send({ names: [" Bia ", "ANA", "Bia", "", "x".repeat(101)] })
    .expect(201);
  expect(response.body.created).toEqual([{ id: 3, name: "Bia" }]);
  expect(response.body.rejected.map(({ code }) => code)).toEqual(["ALREADY_REGISTERED", "DUPLICATE_IN_IMPORT", "EMPTY_NAME", "NAME_TOO_LONG"]);
  expect(JSON.parse(await fs.readFile(databasePath, "utf8"))).toHaveLength(3);
});

test.each([
  [{ names: ["Ana"] }, 422, "IMPORT_EMPTY_RESULT"],
  [{ names: ["", "x".repeat(101)] }, 422, "IMPORT_EMPTY_RESULT"],
  [{ names: "Ana" }, 400, "INVALID_IMPORT_BODY"],
  [{ names: ["Bia"], extra: true }, 400, "UNKNOWN_FIELDS"],
])("validates participant imports", async (body, status, code) => {
  const response = await request(app).post("/api/participants/import").send(body).expect(status);
  expect(response.body.error.code).toBe(code);
});

test("creates and persists a participant with a new ID", async () => {
  const response = await request(app)
    .post("/api/participants")
    .send({ name: "  Sofia  " })
    .expect("Location", "/api/participants/3")
    .expect(201);
  expect(response.body).toEqual({ id: 3, name: "Sofia" });
  expect(JSON.parse(await fs.readFile(databasePath, "utf8"))).toContainEqual(response.body);
});

test("replaces and patches a participant", async () => {
  await request(app).put("/api/participants/1").send({ name: "Beatriz" }).expect(200, { id: 1, name: "Beatriz" });
  await request(app).patch("/api/participants/1").send({ name: "Clara" }).expect(200, { id: 1, name: "Clara" });
  const saved = JSON.parse(await fs.readFile(databasePath, "utf8"));
  expect(saved[0]).toEqual({ id: 1, name: "Clara" });
});

test("deletes a participant and returns no content", async () => {
  await request(app).delete("/api/participants/1").expect(204);
  await request(app).get("/api/participants/1").expect(404);
});

test.each([
  ["invalid ID", "get", "/api/participants/nope", undefined, 400, "INVALID_ID"],
  ["missing participant", "get", "/api/participants/99", undefined, 404, "PARTICIPANT_NOT_FOUND"],
  ["missing name", "post", "/api/participants", {}, 422, "NAME_REQUIRED"],
  ["invalid name", "post", "/api/participants", { name: 12 }, 422, "INVALID_NAME"],
  ["unknown field", "post", "/api/participants", { name: "Luís", admin: true }, 400, "UNKNOWN_FIELDS"],
  ["duplicate name", "post", "/api/participants", { name: "  ANA " }, 409, "DUPLICATE_NAME"],
  ["empty patch", "patch", "/api/participants/1", {}, 422, "NAME_REQUIRED"],
])("returns a structured error for %s", async (_label, method, url, body, status, code) => {
  let operation = request(app)[method](url);
  if (body !== undefined) operation = operation.send(body);
  const response = await operation.expect(status);
  expect(response.body.error).toEqual(expect.objectContaining({ code, message: expect.any(String) }));
});

test("rejects malformed JSON and unknown routes", async () => {
  const malformed = await request(app)
    .post("/api/participants")
    .set("Content-Type", "application/json")
    .send('{"name":')
    .expect(400);
  expect(malformed.body.error.code).toBe("MALFORMED_JSON");
  const missingRoute = await request(app).get("/api/nope").expect(404);
  expect(missingRoute.body.error.code).toBe("ROUTE_NOT_FOUND");
});

test("returns a controlled error when persistence fails", async () => {
  const repository = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockRejectedValue(new Error("disk failed")),
  };
  const response = await request(createApp({ repository }))
    .post("/api/participants")
    .send({ name: "Sofia" })
    .expect(500);
  expect(response.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Ocorreu um erro interno." } });
});
