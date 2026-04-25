import { describe, it, expect } from "@jest/globals";
import { ValidationError } from "../../domain/errors/validationError";
import { validateCollection } from "../collectionValidation";

describe("validateCollection", () => {
  it("nao deve lançar erro para input válido", () => {
    expect(() =>
      validateCollection({
        material: "papel",
        weightKg: 3.5,
        createdAt: "2026-04-25T10:00:00.000Z",
        latitude: -22.9,
        longitude: -43.2,
      }),
    ).not.toThrow();
  });

  it("deve lançar ValidationError para material inválido", () => {
    expect(() =>
      validateCollection({
        material: "madeira" as never,
        weightKg: 3.5,
        createdAt: "2026-04-25T10:00:00.000Z",
      }),
    ).toThrow(ValidationError);
  });

  it("deve lançar ValidationError para weightKg <= 0", () => {
    expect(() =>
      validateCollection({
        material: "metal",
        weightKg: 0,
        createdAt: "2026-04-25T10:00:00.000Z",
      }),
    ).toThrow(ValidationError);
  });

  it("deve lançar ValidationError para createdAt inválido", () => {
    expect(() =>
      validateCollection({
        material: "vidro",
        weightKg: 2,
        createdAt: "data-invalida",
      }),
    ).toThrow(ValidationError);
  });

  it("deve lançar ValidationError para latitude fora da faixa", () => {
    expect(() =>
      validateCollection({
        material: "outros",
        weightKg: 2,
        createdAt: "2026-04-25T10:00:00.000Z",
        latitude: 91,
      }),
    ).toThrow(ValidationError);
  });
});
