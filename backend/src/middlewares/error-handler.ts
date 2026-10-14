import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../errors/app-error";

export const notFoundHandler: RequestHandler = (_request, _response, next): void => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Rota não encontrada."));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next): void => {
  if (
    error instanceof SyntaxError
    && "status" in error
    && error.status === 400
    && "body" in error
  ) {
    response.status(400).json({
      error: { code: "MALFORMED_JSON", message: "O JSON enviado é inválido." },
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.details || {}) },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Ocorreu um erro interno." },
  });
};
