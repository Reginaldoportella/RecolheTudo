import test from "node:test";
import assert from "node:assert/strict";

import { validateAnalyticsQuery } from "./analytics-schema.mjs";

test("validateAnalyticsQuery aceita period daily", () => {
  const params = new URLSearchParams({
    period: "daily",
    date: "2026-05-20",
  });

  assert.deepEqual(validateAnalyticsQuery(params), {
    period: "daily",
    date: "2026-05-20",
  });
});

test("validateAnalyticsQuery rejeita period invalido", () => {
  const params = new URLSearchParams({
    period: "monthly",
    date: "2026-05-20",
  });

  assert.throws(() => validateAnalyticsQuery(params), /period deve ser daily ou weekly/);
});
