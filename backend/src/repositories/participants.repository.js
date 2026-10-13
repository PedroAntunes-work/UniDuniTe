const fs = require("node:fs/promises");

class ParticipantsRepository {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async readAll() {
    const content = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(content);
  }

  async findAll() {
    return this.readAll();
  }

  async findById(id) {
    const participants = await this.readAll();
    return participants.find((participant) => participant.id === id) ?? null;
  }

  async create(name) {
    const participants = await this.readAll();
    const nextId = participants.reduce((max, participant) => Math.max(max, participant.id), 0) + 1;
    const participant = { id: nextId, name };
    await this.writeAll([...participants, participant]);
    return participant;
  }

  async import(names) {
    const participants = await this.readAll();
    const nextId = participants.reduce((max, participant) => Math.max(max, participant.id), 0) + 1;
    const created = names.map((name, index) => ({ id: nextId + index, name }));
    await this.writeAll([...participants, ...created]);
    return created;
  }

  async update(id, name) {
    const participants = await this.readAll();
    const index = participants.findIndex((participant) => participant.id === id);
    if (index === -1) return null;
    const participant = { id, name };
    participants[index] = participant;
    await this.writeAll(participants);
    return participant;
  }

  async delete(id) {
    const participants = await this.readAll();
    const filtered = participants.filter((participant) => participant.id !== id);
    if (filtered.length === participants.length) return false;
    await this.writeAll(filtered);
    return true;
  }

  async writeAll(participants) {
    await fs.writeFile(this.filePath, `${JSON.stringify(participants, null, 2)}\n`, "utf8");
  }
}

module.exports = ParticipantsRepository;
