import test from "node:test";
import assert from "node:assert/strict";

import { validateSyncPayload } from "./sync-schema.mjs";

test("validateSyncPayload normaliza envelope de colecoes", () => {
  const result = validateSyncPayload({
    deviceId: "device_123",
    userId: null,
    lastPulledAt: "2026-05-20T12:00:00.000Z",
    changes: {
      collections: {
        created: [
          {
            remoteId: "local-1",
            localId: 1,
            material: "papel",
            weightKg: 2.5,
            collectedAt: "2026-05-20T10:00:00.000Z",
            createdAt: "2026-05-20T10:00:00.000Z",
            updatedAt: "2026-05-20T10:00:00.000Z",
          },
        ],
      },
    },
  });

  assert.equal(result.deviceId, "device_123");
  assert.equal(result.changes.collections.created.length, 1);
  assert.equal(result.changes.collections.created[0].localId, "1");
  assert.equal(result.changes.collections.updated.length, 0);
  assert.equal(result.changes.collections.deleted.length, 0);
});

test("validateSyncPayload rejeita payload sem deviceId", () => {
  assert.throws(
    () =>
      validateSyncPayload({
        changes: { collections: { created: [], updated: [], deleted: [] } },
      }),
    /deviceId e obrigatorio/,
  );
});
