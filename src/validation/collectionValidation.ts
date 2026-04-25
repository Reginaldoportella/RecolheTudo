import type { CollectionInput } from "../domain/types/collection";
import { ValidationError } from "../domain/errors/validationError";

const VALID_MATERIALS = new Set([
  "papel",
  "plastico",
  "metal",
  "vidro",
  "outros",
]);

export function validateCollection(input: CollectionInput): void {
  const errors: Record<string, string> = {};

  if (!VALID_MATERIALS.has(input.material)) {
    errors.material = "material invalido";
  }

  if (!(input.weightKg > 0) || input.weightKg > 1000) {
    errors.weightKg = "weightKg deve ser > 0 e <= 1000";
  }

  if (!input.createdAt) {
    errors.createdAt = "createdAt obrigatorio";
  } else if (Number.isNaN(Date.parse(input.createdAt))) {
    errors.createdAt = "createdAt deve ser ISO-8601 valido";
  }

  if (
    input.latitude != null &&
    (input.latitude < -90 || input.latitude > 90)
  ) {
    errors.latitude = "latitude deve estar entre -90 e 90";
  }

  if (
    input.longitude != null &&
    (input.longitude < -180 || input.longitude > 180)
  ) {
    errors.longitude = "longitude deve estar entre -180 e 180";
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}
