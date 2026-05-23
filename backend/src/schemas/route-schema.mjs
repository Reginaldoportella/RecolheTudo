import { ValidationError } from "../utils/http-error.mjs";

function isCoordinate(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number"
  );
}

export function validateRoutePlanPayload(body) {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Payload de rota invalido.");
  }

  if (!isCoordinate(body.origin)) {
    throw new ValidationError("origin deve conter latitude e longitude.");
  }

  if (!Array.isArray(body.destinations)) {
    throw new ValidationError("destinations deve ser um array.");
  }

  for (const point of body.destinations) {
    if (!isCoordinate(point)) {
      throw new ValidationError(
        "Cada item de destinations deve conter latitude e longitude.",
      );
    }
  }

  return body;
}
