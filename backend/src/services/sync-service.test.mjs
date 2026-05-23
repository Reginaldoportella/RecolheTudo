import test from "node:test";
import assert from "node:assert/strict";

import { query, initDatabase } from "../data/postgres.mjs";
import { syncEntities } from "./sync-service.mjs";

async function resetCollections() {
  await query("DELETE FROM collections;");
}

test("syncEntities persiste criacao e devolve pull com o novo registro", async () => {
  await initDatabase();
  await resetCollections();

  const result = await syncEntities({
    deviceId: "device_123",
    userId: null,
    lastPulledAt: null,
    changes: {
      collections: {
        created: [
          {
            remoteId: "local-1",
            localId: "1",
            material: "papel",
            weightKg: 2.5,
            collectedAt: "2026-05-20T10:00:00.000Z",
            createdAt: "2026-05-20T10:00:00.000Z",
            updatedAt: "2026-05-20T10:00:00.000Z",
            latitude: null,
            longitude: null,
            locationAccuracy: null,
            notes: null,
          },
        ],
        updated: [],
        deleted: [],
      },
    },
  });

  assert.equal(result.accepted.collections.created.length, 1);
  assert.equal(result.rejected.collections.created.length, 0);
  assert.equal(result.pull.collections.created.length, 1);

  const persisted = await query(
    "SELECT remote_id, deleted_at FROM collections WHERE remote_id = $1;",
    ["local-1"],
  );

  assert.equal(persisted.rowCount, 1);
  assert.equal(persisted.rows[0].remote_id, "local-1");
  assert.equal(persisted.rows[0].deleted_at, null);
});

test("syncEntities aplica soft delete e devolve exclusao no pull", async () => {
  await initDatabase();
  await resetCollections();

  await syncEntities({
    deviceId: "device_123",
    userId: null,
    lastPulledAt: null,
    changes: {
      collections: {
        created: [
          {
            remoteId: "srv-delete-1",
            localId: "1",
            material: "metal",
            weightKg: 4,
            collectedAt: "2026-05-20T09:00:00.000Z",
            createdAt: "2026-05-20T09:00:00.000Z",
            updatedAt: "2026-05-20T09:00:00.000Z",
            latitude: null,
            longitude: null,
            locationAccuracy: null,
            notes: null,
          },
        ],
        updated: [],
        deleted: [],
      },
    },
  });

  const result = await syncEntities({
    deviceId: "device_123",
    userId: null,
    lastPulledAt: "1970-01-01T00:00:00.000Z",
    changes: {
      collections: {
        created: [],
        updated: [],
        deleted: [
          {
            remoteId: "srv-delete-1",
            localId: "1",
            updatedAt: "2026-05-20T11:00:00.000Z",
            deletedAt: "2026-05-20T11:00:00.000Z",
          },
        ],
      },
    },
  });

  assert.equal(result.accepted.collections.deleted.length, 1);

  const persisted = await query(
    "SELECT deleted_at FROM collections WHERE remote_id = $1;",
    ["srv-delete-1"],
  );

  assert.ok(persisted.rows[0].deleted_at);
  assert.equal(result.pull.collections.deleted.length >= 1, true);
});

test("syncEntities rejeita payload invalido sem deviceId", async () => {
  await initDatabase();

  await assert.rejects(
    () =>
      syncEntities({
        changes: {
          collections: {
            created: [],
            updated: [],
            deleted: [],
          },
        },
      }),
    /deviceId e obrigatorio/,
  );
});
