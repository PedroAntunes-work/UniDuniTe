import { AppError } from "../errors/app-error";
import {
  importBodySchema,
  MAX_NAME_LENGTH,
  participantBodySchema,
  participantNameSchema,
  requestObjectSchema,
} from "../schemas/participants.schema";
import type {
  ImportParticipantsResult,
  ImportRejectionCode,
  Participant,
  ParticipantsRepositoryContract,
  RejectedParticipant,
} from "../types/participants";

const ALLOWED_FIELDS = new Set(["name"]);
const IMPORT_ALLOWED_FIELDS = new Set(["names"]);

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && error.code === "SQLITE_CONSTRAINT_UNIQUE";
}

export class ParticipantsService {
  constructor(private readonly repository: ParticipantsRepositoryContract) {}

  async list(): Promise<Participant[]> {
    return this.repository.findAll();
  }

  async get(idValue: string): Promise<Participant> {
    const id = this.parseId(idValue);
    const participant = this.repository.findById(id);
    if (!participant) this.notFound();
    return participant;
  }

  async create(body: unknown): Promise<Participant> {
    const name = this.validateBody(body, true);
    if (name === undefined) throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
    await this.ensureUniqueName(name);
    return this.save(() => this.repository.create(name));
  }

  async import(body: unknown): Promise<ImportParticipantsResult> {
    const bodyObject = requestObjectSchema.safeParse(body);
    if (!bodyObject.success || !Array.isArray(bodyObject.data.names)) {
      throw new AppError(400, "INVALID_IMPORT_BODY", "Envie um objeto com uma lista names.");
    }

    const unknownFields = Object.keys(bodyObject.data)
      .filter((field) => !IMPORT_ALLOWED_FIELDS.has(field));
    if (unknownFields.length > 0) {
      throw new AppError(400, "UNKNOWN_FIELDS", `Campos não permitidos: ${unknownFields.join(", ")}.`);
    }

    const parsedBody = importBodySchema.safeParse(bodyObject.data);
    if (!parsedBody.success) {
      throw new AppError(400, "INVALID_IMPORT_BODY", "Envie um objeto com uma lista names.");
    }
    if (parsedBody.data.names.length === 0) {
      throw new AppError(422, "EMPTY_IMPORT", "A lista de nomes não pode estar vazia.");
    }

    const existing = this.repository.findAll();
    const existingNames = new Set(existing.map(({ name }) => this.normalizeName(name)));
    const seen = new Set(existingNames);
    const createdNames: string[] = [];
    const rejected: RejectedParticipant[] = [];

    parsedBody.data.names.forEach((value, index) => {
      const parsedName = participantNameSchema.safeParse(value);
      if (!parsedName.success) {
        const code: ImportRejectionCode = typeof value !== "string" || !value.trim()
          ? "EMPTY_NAME"
          : "NAME_TOO_LONG";
        rejected.push({ index, name: typeof value === "string" ? value.trim() : "", code });
        return;
      }

      const name = parsedName.data;
      const normalized = this.normalizeName(name);
      if (seen.has(normalized)) {
        const code: ImportRejectionCode = existingNames.has(normalized)
          ? "ALREADY_REGISTERED"
          : "DUPLICATE_IN_IMPORT";
        rejected.push({ index, name, code });
        return;
      }

      seen.add(normalized);
      createdNames.push(name);
    });

    const participants = createdNames.length > 0
      ? await this.save(() => this.repository.import(createdNames))
      : [];
    if (participants.length === 0) {
      throw new AppError(422, "IMPORT_EMPTY_RESULT", "Nenhum nome novo pôde ser importado.", {
        created: [],
        rejected,
      });
    }
    return { created: participants, rejected };
  }

  async replace(idValue: string, body: unknown): Promise<Participant> {
    const id = this.parseId(idValue);
    const name = this.validateBody(body, true);
    if (name === undefined) throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
    if (!this.repository.findById(id)) this.notFound();
    await this.ensureUniqueName(name, id);
    const updated = await this.save(() => this.repository.update(id, name));
    if (!updated) this.notFound();
    return updated;
  }

  async patch(idValue: string, body: unknown): Promise<Participant> {
    const id = this.parseId(idValue);
    const current = this.repository.findById(id);
    if (!current) this.notFound();
    const name = this.validateBody(body, false);
    if (name === undefined) {
      throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
    }
    await this.ensureUniqueName(name, current.id);
    const updated = await this.save(() => this.repository.update(id, name));
    if (!updated) this.notFound();
    return updated;
  }

  async remove(idValue: string): Promise<void> {
    const id = this.parseId(idValue);
    const removed = this.repository.delete(id);
    if (!removed) this.notFound();
  }

  private parseId(value: string): number {
    if (!/^\d+$/.test(value) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) {
      throw new AppError(400, "INVALID_ID", "O ID deve ser um número inteiro positivo.");
    }
    return Number(value);
  }

  private validateBody(body: unknown, requireName: boolean): string | undefined {
    const objectResult = requestObjectSchema.safeParse(body);
    if (!objectResult.success) {
      throw new AppError(400, "INVALID_BODY", "O corpo da requisição deve ser um objeto JSON.");
    }

    const unknownFields = Object.keys(objectResult.data)
      .filter((field) => !ALLOWED_FIELDS.has(field));
    if (unknownFields.length > 0) {
      throw new AppError(400, "UNKNOWN_FIELDS", `Campos não permitidos: ${unknownFields.join(", ")}.`);
    }

    const parsedBody = participantBodySchema.safeParse(objectResult.data);
    if (!parsedBody.success) {
      throw new AppError(400, "INVALID_BODY", "O corpo da requisição deve ser um objeto JSON.");
    }
    if (!("name" in parsedBody.data)) {
      if (requireName) throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
      return undefined;
    }

    const parsedName = participantNameSchema.safeParse(parsedBody.data.name);
    if (!parsedName.success) {
      if (typeof parsedBody.data.name !== "string") {
        throw new AppError(422, "INVALID_NAME", "O nome deve ser um texto.");
      }
      if (!parsedBody.data.name.trim()) {
        throw new AppError(422, "NAME_REQUIRED", "Informe o nome do participante.");
      }
      throw new AppError(
        422,
        "NAME_TOO_LONG",
        `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      );
    }
    return parsedName.data;
  }

  private normalizeName(name: string): string {
    return name.trim().toLocaleLowerCase("pt-BR");
  }

  private async ensureUniqueName(name: string, ignoredId: number | null = null): Promise<void> {
    const normalized = this.normalizeName(name);
    const participants = this.repository.findAll();
    const duplicate = participants.some(
      (participant) => participant.id !== ignoredId && this.normalizeName(participant.name) === normalized,
    );
    if (duplicate) throw new AppError(409, "DUPLICATE_NAME", "Já existe um participante com esse nome.");
  }

  private async save<T>(operation: () => T): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new AppError(409, "DUPLICATE_NAME", "Já existe um participante com esse nome.");
      }
      throw error;
    }
  }

  private notFound(): never {
    throw new AppError(404, "PARTICIPANT_NOT_FOUND", "Participante não encontrado.");
  }
}
