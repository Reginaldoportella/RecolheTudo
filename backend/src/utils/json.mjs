export class JsonBodyParseError extends Error {
  constructor(message = "JSON invalido no corpo da requisicao.") {
    super(message);
    this.name = "JsonBodyParseError";
  }
}

export async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return null;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new JsonBodyParseError();
  }
}

export function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    ...headers,
  });
  response.end(JSON.stringify(payload));
}
