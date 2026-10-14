export interface Participant {
  id: number;
  name: string;
}

export type ImportRejectionCode =
  | "ALREADY_REGISTERED"
  | "DUPLICATE_IN_IMPORT"
  | "EMPTY_NAME"
  | "NAME_TOO_LONG";

export interface RejectedParticipant {
  index: number;
  name: string;
  code: ImportRejectionCode;
}

export interface ImportParticipantsResult {
  created: Participant[];
  rejected: RejectedParticipant[];
}

export interface ParticipantsRepositoryContract {
  findAll(): Participant[];
  findById(id: number): Participant | null;
  create(name: string): Participant;
  import(names: string[]): Participant[];
  update(id: number, name: string): Participant | null;
  delete(id: number): boolean;
}
