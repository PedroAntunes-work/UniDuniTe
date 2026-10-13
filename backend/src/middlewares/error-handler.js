const AppError = require("../errors/app-error");

function notFoundHandler(_request, _response, next) {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Rota não encontrada."));
}

function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return response.status(400).json({
      error: { code: "MALFORMED_JSON", message: "O JSON enviado é inválido." },
    });
  }

  if (error instanceof AppError) {
    return response.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.details || {}) },
    });
  }

  console.error(error);
  return response.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Ocorreu um erro interno." },
  });
}

module.exports = { notFoundHandler, errorHandler };
