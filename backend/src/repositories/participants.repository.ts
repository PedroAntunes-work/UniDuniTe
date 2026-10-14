import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { legacyParticipantsSchema } from "../schemas/participants.schema";
import type { Participant, ParticipantsRepositoryContract } from "../types/participants";

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("pt-BR");
}

export class ParticipantsRepository implements ParticipantsRepositoryContract {
  private readonly database: Database.Database;

  constructor(filePath: string, legacyFilePath: string | null = null) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.database = new Database(filePath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS participants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS migrations (
        name TEXT PRIMARY KEY
      );
    `);
    this.migrateJson(legacyFilePath);
  }

  findAll(): Participant[] {
    return this.database
      .prepare("SELECT id, name FROM participants ORDER BY id")
      .all() as Participant[];
  }

  findById(id: number): Participant | null {
    return (this.database
      .prepare("SELECT id, name FROM participants WHERE id = ?")
      .get(id) as Participant | undefined) ?? null;
  }

  create(name: string): Participant {
    const result = this.database
      .prepare("INSERT INTO participants (name, normalized_name) VALUES (?, ?)")
      .run(name, normalizeName(name));
    return { id: Number(result.lastInsertRowid), name };
  }

  import(names: string[]): Participant[] {
    const insert = this.database.prepare(
      "INSERT INTO participants (name, normalized_name) VALUES (?, ?)",
    );
    const insertMany = this.database.transaction((values: string[]) =>
      values.map((name) => {
        const result = insert.run(name, normalizeName(name));
        return { id: Number(result.lastInsertRowid), name };
      }),
    );
    return insertMany(names);
  }

  update(id: number, name: string): Participant | null {
    const result = this.database
      .prepare("UPDATE participants SET name = ?, normalized_name = ? WHERE id = ?")
      .run(name, normalizeName(name), id);
    if (result.changes === 0) return null;
    return { id, name };
  }

  delete(id: number): boolean {
    return this.database.prepare("DELETE FROM participants WHERE id = ?").run(id).changes > 0;
  }

  close(): void {
    this.database.close();
  }

  private migrateJson(legacyFilePath: string | null): void {
    if (!legacyFilePath || !fs.existsSync(legacyFilePath)) return;
    if (this.database.prepare("SELECT 1 FROM migrations WHERE name = ?").get("participants-json-v1")) return;

    const transaction = this.database.transaction(() => {
      const hasParticipants = this.database
        .prepare("SELECT 1 FROM participants LIMIT 1")
        .get();

      if (!hasParticipants) {
        const legacyData: unknown = JSON.parse(fs.readFileSync(legacyFilePath, "utf8"));
        const parsedParticipants = legacyParticipantsSchema.safeParse(legacyData);
        if (!parsedParticipants.success) {
          if (!Array.isArray(legacyData)) {
            throw new TypeError("O arquivo legado de participantes deve conter uma lista.");
          }
          throw new TypeError("O arquivo legado contém um participante inválido.");
        }
        const insert = this.database.prepare(
          "INSERT INTO participants (id, name, normalized_name) VALUES (?, ?, ?)",
        );
        for (const participant of parsedParticipants.data) {
          insert.run(participant.id, participant.name, normalizeName(participant.name));
        }
      }

      this.database.prepare("INSERT INTO migrations (name) VALUES (?)").run("participants-json-v1");
    });

    transaction();
  }
}
