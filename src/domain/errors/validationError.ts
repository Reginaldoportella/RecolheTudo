import type { ErrorCode } from "./appError";

export class ValidationError extends Error {
  code: ErrorCode = "VALIDATION_ERROR";
  fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Dados invalidos para registro de coleta");
    this.name = "ValidationError";
    this.fields = fields;
  }
}
