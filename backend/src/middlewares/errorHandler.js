export default function errorHandler(err, _req, res, _next) {
  if (Array.isArray(err?.details)) {
    return res.status(err.statusCode || 400).json({ erro: 'Dados inválidos.', detalhes: err.details });
  }

  const status = err.statusCode || 500;
  const mensagem =
    err.message || 'Ocorreu um erro inesperado. Tente novamente mais tarde.';

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({ erro: mensagem });
}
