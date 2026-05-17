import { describe, it, expect } from "@jest/globals";
import { ValidationError } from "../../domain/errors/validationError";
import type { CollectionInput } from "../../domain/types/collection";
import { validateCollection } from "../collectionValidation";

const validInput: CollectionInput = {
  material: "papel",
  weightRange: "medium",
  weightKg: 3.5,
  collectedAt: "2026-04-25T10:00:00.000Z",
  createdAt: "2026-04-25T10:00:00.000Z",
  latitude: -22.9,
  longitude: -43.2,
  locationAccuracy: 12,
};

describe("validateCollection", () => {
  it("nao deve lancar erro para input valido do modelo atual", () => {
    expect(() => validateCollection(validInput)).not.toThrow();
  });

  it("deve lancar ValidationError para material invalido", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        material: "madeira" as never,
      }),
    ).toThrow(ValidationError);
  });

  it("deve lancar ValidationError para weightRange invalido", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        weightRange: "extra-large" as never,
      }),
    ).toThrow(ValidationError);
  });

  it("deve lancar ValidationError para weightKg <= 0", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        weightKg: 0,
      }),
    ).toThrow(ValidationError);
  });

  it("deve lancar ValidationError para collectedAt invalido", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        collectedAt: "data-invalida",
      }),
    ).toThrow(ValidationError);
  });

  it("deve lancar ValidationError para createdAt invalido", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        createdAt: "data-invalida",
      }),
    ).toThrow(ValidationError);
  });

  it("deve lancar ValidationError para latitude fora da faixa", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        latitude: 91,
      }),
    ).toThrow(ValidationError);
  });

  it("deve lancar ValidationError para locationAccuracy negativa", () => {
    expect(() =>
      validateCollection({
        ...validInput,
        locationAccuracy: -1,
      }),
    ).toThrow(ValidationError);
  });
});
