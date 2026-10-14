import { z } from "zod";

export const MAX_NAME_LENGTH = 100;

export const requestObjectSchema = z.object({}).passthrough();

export const participantBodySchema = z.object({
  name: z.unknown().optional(),
}).strict();

export const participantNameSchema = z.string()
  .trim()
  .min(1, { message: "NAME_REQUIRED" })
  .max(MAX_NAME_LENGTH, { message: "NAME_TOO_LONG" });

export const importBodySchema = z.object({
  names: z.array(z.unknown()),
}).strict();

export const legacyParticipantsSchema = z.array(z.object({
  id: z.number().int().safe().positive(),
  name: z.string(),
}));
