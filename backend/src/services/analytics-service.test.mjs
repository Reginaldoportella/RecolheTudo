import test from "node:test";
import assert from "node:assert/strict";

import { buildWeeklySummary, getAnalyticsMaterials, getAnalyticsProductivity } from "./analytics-service.mjs";
import { initDatabase, query } from "../data/postgres.mjs";

test("buildWeeklySummary agrega total e quantidade", () => {
  const result = buildWeeklySummary("2026-05-20", [
    { date: "2026-05-14", totalKg: 1.5, collectionsCount: 1 },
    { date: "2026-05-15", totalKg: 2.5, collectionsCount: 2 },
  ]);

  assert.equal(result.startDate, "2026-05-14");
  assert.equal(result.endDate, "2026-05-15");
  assert.equal(result.totalKg, 4);
  assert.equal(result.collectionsCount, 3);
});

test("getAnalyticsMaterials agrega materiais por periodo", async () => {
  await initDatabase();
  await query("DELETE FROM collections;");
  await query(
    `
      INSERT INTO collections (
        remote_id, local_id, material, weight_kg, collected_at, created_at,
        updated_at, deleted_at, synced_at, sync_version, server_updated_at, sync_metadata
      ) VALUES
      ('mat-1', '1', 'papel', 2.0, '2026-05-20T08:00:00.000Z', '2026-05-20T08:00:00.000Z', NOW(), NULL, NOW(), 1, NOW(), '{}'::jsonb),
      ('mat-2', '2', 'papel', 1.5, '2026-05-20T09:00:00.000Z', '2026-05-20T09:00:00.000Z', NOW(), NULL, NOW(), 1, NOW(), '{}'::jsonb),
      ('mat-3', '3', 'vidro', 3.0, '2026-05-20T10:00:00.000Z', '2026-05-20T10:00:00.000Z', NOW(), NULL, NOW(), 1, NOW(), '{}'::jsonb);
    `,
  );

  const result = await getAnalyticsMaterials("daily", "2026-05-20");

  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].material, "papel");
  assert.equal(result.items[0].totalKg, 3.5);
});

test("getAnalyticsProductivity devolve serie semanal", async () => {
  await initDatabase();
  await query("DELETE FROM collections;");
  await query(
    `
      INSERT INTO collections (
        remote_id, local_id, material, weight_kg, collected_at, created_at,
        updated_at, deleted_at, synced_at, sync_version, server_updated_at, sync_metadata
      ) VALUES
      ('prod-1', '1', 'metal', 4.0, '2026-05-19T08:00:00.000Z', '2026-05-19T08:00:00.000Z', NOW(), NULL, NOW(), 1, NOW(), '{}'::jsonb),
      ('prod-2', '2', 'papel', 1.0, '2026-05-20T08:00:00.000Z', '2026-05-20T08:00:00.000Z', NOW(), NULL, NOW(), 1, NOW(), '{}'::jsonb);
    `,
  );

  const result = await getAnalyticsProductivity("weekly", "2026-05-20");

  assert.equal(result.period, "weekly");
  assert.equal(result.points.length, 7);
  assert.equal(result.points.at(-1)?.totalKg, 1);
});
