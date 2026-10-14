import type { Request, Response } from "express";
import type { ParticipantsService } from "../services/participants.service";

interface ParticipantParams {
  id: string;
}

export function createParticipantsController(service: ParticipantsService) {
  return {
    async list(_request: Request, response: Response): Promise<void> {
      response.status(200).json(await service.list());
    },

    async import(request: Request, response: Response): Promise<void> {
      response.status(201).json(await service.import(request.body));
    },

    async get(request: Request<ParticipantParams>, response: Response): Promise<void> {
      response.status(200).json(await service.get(request.params.id));
    },

    async create(request: Request, response: Response): Promise<void> {
      const participant = await service.create(request.body);
      response.status(201).location(`/api/participants/${participant.id}`).json(participant);
    },

    async replace(request: Request<ParticipantParams>, response: Response): Promise<void> {
      response.status(200).json(await service.replace(request.params.id, request.body));
    },

    async patch(request: Request<ParticipantParams>, response: Response): Promise<void> {
      response.status(200).json(await service.patch(request.params.id, request.body));
    },

    async remove(request: Request<ParticipantParams>, response: Response): Promise<void> {
      await service.remove(request.params.id);
      response.status(204).send();
    },
  };
}
