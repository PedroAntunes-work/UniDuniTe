function createParticipantsController(service) {
  return {
    async list(_request, response) {
      response.status(200).json(await service.list());
    },

    async import(request, response) {
      response.status(201).json(await service.import(request.body));
    },

    async get(request, response) {
      response.status(200).json(await service.get(request.params.id));
    },

    async create(request, response) {
      const participant = await service.create(request.body);
      response.status(201).location(`/api/participants/${participant.id}`).json(participant);
    },

    async replace(request, response) {
      response.status(200).json(await service.replace(request.params.id, request.body));
    },

    async patch(request, response) {
      response.status(200).json(await service.patch(request.params.id, request.body));
    },

    async remove(request, response) {
      await service.remove(request.params.id);
      response.status(204).send();
    },
  };
}

module.exports = createParticipantsController;
