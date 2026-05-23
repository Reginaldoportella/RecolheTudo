import { collectionsRepository } from "../data/repositories/collectionsRepository";
import {
  backendService,
  type BackendCollectionPayload,
  type BackendSyncRequest,
  type BackendSyncResponse,
} from "./backendService";
import { deviceIdentityService } from "./deviceIdentityService";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Falha inesperada durante sincronizacao.";
}

export const collectionsSyncService = {
  async processPendingQueue(limit = 20): Promise<void> {
    const queue = await collectionsRepository.getPendingSyncQueue(limit);

    if (queue.length === 0) {
      return;
    }

    const deviceId = await deviceIdentityService.getDeviceId();
    const lastPulledAt = await collectionsRepository.getLastSyncedAt();
    const syncAt = new Date().toISOString();
    const payload: BackendSyncRequest = {
      deviceId,
      userId: null,
      lastPulledAt,
      changes: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
    };

    const upsertEntries = [];
    const deleteEntries = [];

    for (const entry of queue) {
      if (entry.operation === "upsert") {
        const item = JSON.parse(entry.payload) as BackendCollectionPayload;
        payload.changes.collections.created.push({
          ...item,
          deviceId,
          userId: null,
          updatedAt: item.updatedAt ?? item.createdAt,
          deletedAt: null,
          syncMetadata: { source: "sqlite_queue" },
        });
        upsertEntries.push(entry);
        continue;
      }

      if (entry.operation === "delete") {
        const item = JSON.parse(entry.payload) as { remoteId: string };
        payload.changes.collections.deleted.push({
          localId: entry.entityId ?? `deleted-${entry.id}`,
          remoteId: item.remoteId,
          userId: null,
          deviceId,
          updatedAt: syncAt,
          deletedAt: syncAt,
        });
        deleteEntries.push(entry);
      }
    }

    let response: BackendSyncResponse | null = null;

    try {
      response = await backendService.syncEntities(payload);
    } catch (error) {
      for (const entry of queue) {
        if (entry.entityId != null) {
          await collectionsRepository.markCollectionSyncError(entry.entityId);
        }

        await collectionsRepository.markSyncQueueFailure(
          entry.id,
          getErrorMessage(error),
        );
      }
      return;
    }

    if (!response) {
      return;
    }

    for (const accepted of [
      ...response.accepted.collections.created,
      ...response.accepted.collections.updated,
    ]) {
      if (accepted.localId == null) {
        continue;
      }

      const localId = Number(accepted.localId);

      if (!Number.isNaN(localId)) {
        await collectionsRepository.markCollectionAsSynced(
          localId,
          accepted.remoteId ?? `local-${localId}`,
          response.syncAt,
        );
      }
    }

    for (const pushed of [
      ...response.pull.collections.created,
      ...response.pull.collections.updated,
    ]) {
      if (pushed.deviceId && pushed.deviceId === deviceId) {
        continue;
      }

      await collectionsRepository.upsertCollectionFromRemote(pushed, response.syncAt);
    }

    for (const deleted of response.pull.collections.deleted) {
      if (deleted.remoteId) {
        await collectionsRepository.deleteByRemoteId(deleted.remoteId);
      }
    }

    const rejectedGroups = [
      ...response.rejected.collections.created,
      ...response.rejected.collections.updated,
      ...response.rejected.collections.deleted,
    ];

    if (rejectedGroups.length > 0 || response.conflicts.collections.length > 0) {
      for (const entry of queue) {
        if (entry.entityId != null) {
          await collectionsRepository.markCollectionSyncError(entry.entityId);
        }

        await collectionsRepository.markSyncQueueFailure(
          entry.id,
          rejectedGroups[0]?.message ?? "Conflito ou erro parcial durante sincronizacao.",
        );
      }
      return;
    }

    for (const entry of [...upsertEntries, ...deleteEntries]) {
      await collectionsRepository.deleteSyncQueueEntry(entry.id);
    }
  },
};
