const AppError = require("../errors/app-error");

const MAX_NAME_LENGTH = 100;
const ALLOWED_FIELDS = new Set(["name"]);

class ParticipantsService {
  constructor(repository) {
    this.repository = repository;
  }

  async list() {
    return this.repository.findAll();
  }

  async get(idValue) {
    const id = this.parseId(idValue);
    const participant = await this.repository.findById(id);
    if (!participant) this.notFound();
    return participant;
  }

  async create(body) {
    const name = this.validateBody(body, true);
    await this.ensureUniqueName(name);
    return this.repository.create(name);
  }

  async import(body) {
    if (!body || typeof body !== "object" || Array.isArray(body) || !Array.isArray(body.names)) {
      throw new AppError(400, "INVALID_IMPORT_BODY", "Envie um objeto com uma lista names.");
    }
    const unknownFields = Object.keys(body).filter((field) => field !== "names");
    if (unknownFields.length > 0) {
      throw new AppError(400, "UNKNOWN_FIELDS", `Campos não permitidos: ${unknownFields.join(", ")}.`);
    }
    if (body.names.length === 0) {
      throw new AppError(422, "EMPTY_IMPORT", "A lista de nomes não pode estar vazia.");
    }
    const existing = await this.repository.findAll();
    const seen = new Set(existing.map((participant) => this.normalizeName(participant.name)));
    const created = [];
    const rejected = [];
    body.names.forEach((value, index) => {
      const name = typeof value === "string" ? value.trim() : value;
      let code = null;
      if (typeof name !== "string" || !name) code = "EMPTY_NAME";
      else if (name.length > MAX_NAME_LENGTH) code = "NAME_TOO_LONG";
      else if (seen.has(this.normalizeName(name))) code = existing.some((participant) => this.normalizeName(participant.name) === this.normalizeName(name)) ? "ALREADY_REGISTERED" : "DUPLICATE_IN_IMPORT";
      if (code) rejected.push({ index, name: typeof name === "string" ? name : "", code });
      else {
        seen.add(this.normalizeName(name));
        created.push(name);
      }
    });
    const participants = created.length > 0 ? await this.repository.import(created) : [];
    if (participants.length === 0) {
      throw new AppError(422, "IMPORT_EMPTY_RESULT", "Nenhum nome novo pôde ser importado.", { created: [], rejected });
    }
    return { created: participants, rejected };
  }

  async replace(idValue, body) {
    const id = this.parseId(idValue);
    const name = this.validateBody(body, true);
    await this.get(id);
    await this.ensureUniqueName(name, id);
    return this.repository.update(id, name);
  }

  async patch(idValue, body) {
    const id = this.parseId(idValue);
    const current = await this.get(id);
    const name = this.validateBody(body, false);
    if (name === undefined) {
      throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
    }
    await this.ensureUniqueName(name, current.id);
    return this.repository.update(id, name);
  }

  async remove(idValue) {
    const id = this.parseId(idValue);
    const removed = await this.repository.delete(id);
    if (!removed) this.notFound();
  }

  parseId(value) {
    if (!/^\d+$/.test(value) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
      throw new AppError(400, "INVALID_ID", "O ID deve ser um número inteiro positivo.");
    }
    return Number(value);
  }

  validateBody(body, requireName) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError(400, "INVALID_BODY", "O corpo da requisição deve ser um objeto JSON.");
    }
    const unknownFields = Object.keys(body).filter((field) => !ALLOWED_FIELDS.has(field));
    if (unknownFields.length > 0) {
      throw new AppError(400, "UNKNOWN_FIELDS", `Campos não permitidos: ${unknownFields.join(", ")}.`);
    }
    if (!("name" in body)) {
      if (requireName) throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
      return undefined;
    }
    if (typeof body.name !== "string") {
      throw new AppError(422, "INVALID_NAME", "O nome deve ser um texto.");
    }
    const name = body.name.trim();
    if (!name) throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
    if (name.length > MAX_NAME_LENGTH) {
      throw new AppError(422, "NAME_TOO_LONG", `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`);
    }
    return name;
  }

  normalizeName(name) {
    return name.trim().toLocaleLowerCase("pt-BR");
  }

  async ensureUniqueName(name, ignoredId = null) {
    const normalized = this.normalizeName(name);
    const participants = await this.repository.findAll();
    const duplicate = participants.some(
      (participant) => participant.id !== ignoredId && this.normalizeName(participant.name) === normalized,
    );
    if (duplicate) throw new AppError(409, "DUPLICATE_NAME", "Já existe um participante com esse nome.");
  }

  notFound() {
    throw new AppError(404, "PARTICIPANT_NOT_FOUND", "Participante não encontrado.");
  }
}

module.exports = ParticipantsService;
