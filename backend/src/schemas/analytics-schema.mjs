import { ValidationError } from "../utils/http-error.mjs";

export function validateAnalyticsQuery(searchParams) {
  const period = searchParams.get("period");
  const date = searchParams.get("date");

  if (!period || !["daily", "weekly"].includes(period)) {
    throw new ValidationError("Query param period deve ser daily ou weekly.");
  }

  if (!date || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) {
    throw new ValidationError("Query param date e obrigatorio e deve ser valido.");
  }

  return {
    period,
    date,
  };
}
