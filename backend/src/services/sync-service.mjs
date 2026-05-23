import {
  listCollectionChangesSince,
  softDeleteCollections,
  upsertCollections,
} from "../data/collections-repository.mjs";
import { validateSyncPayload } from "../schemas/sync-schema.mjs";

function emptyEntityBucket() {
  return {
    created: [],
    updated: [],
    deleted: [],
  };
}

export async function syncEntities(payload) {
  const syncPayload = validateSyncPayload(payload);
  const accepted = emptyEntityBucket();
  const rejected = emptyEntityBucket();
  const conflicts = [];

  try {
    accepted.created = await upsertCollections(syncPayload.changes.collections.created);
  } catch (error) {
    rejected.created.push({
      code: "SYNC_CREATE_FAILED",
      message: error instanceof Error ? error.message : "Falha ao sincronizar criacoes.",
    });
  }

  try {
    accepted.updated = await upsertCollections(syncPayload.changes.collections.updated);
  } catch (error) {
    rejected.updated.push({
      code: "SYNC_UPDATE_FAILED",
      message: error instanceof Error ? error.message : "Falha ao sincronizar atualizacoes.",
    });
  }

  try {
    accepted.deleted = await softDeleteCollections(syncPayload.changes.collections.deleted);
  } catch (error) {
    rejected.deleted.push({
      code: "SYNC_DELETE_FAILED",
      message: error instanceof Error ? error.message : "Falha ao sincronizar exclusoes.",
    });
  }

  const pull = {
    collections: await listCollectionChangesSince(syncPayload.lastPulledAt),
  };

  return {
    requestDeviceId: syncPayload.deviceId,
    syncAt: new Date().toISOString(),
    accepted: {
      collections: accepted,
    },
    rejected: {
      collections: rejected,
    },
    conflicts: {
      collections: conflicts,
    },
    pull,
  };
}
