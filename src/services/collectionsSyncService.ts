import { collectionsRepository } from "../data/repositories/collectionsRepository";
import {
  backendService,
  type BackendCollectionPayload,
} from "./backendService";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Falha inesperada durante sincronizacao.";
}

export const collectionsSyncService = {
  async processPendingQueue(limit = 20): Promise<void> {
    const queue = await collectionsRepository.getPendingSyncQueue(limit);

    for (const entry of queue) {
      try {
        if (entry.operation === "upsert") {
          const payload = JSON.parse(entry.payload) as BackendCollectionPayload;
          const response = await backendService.syncCollections([payload]);
          const accepted = response?.acceptedCollections[0] ?? null;

          if (entry.entityId != null && accepted) {
            await collectionsRepository.markCollectionAsSynced(
              entry.entityId,
              accepted.remoteId,
              response?.syncCursor ?? new Date().toISOString(),
            );
          }

          await collectionsRepository.deleteSyncQueueEntry(entry.id);
          continue;
        }

        if (entry.operation === "delete") {
          const payload = JSON.parse(entry.payload) as { remoteId: string };
          await backendService.deleteCollectionByRemoteId(payload.remoteId);
          await collectionsRepository.deleteSyncQueueEntry(entry.id);
        }
      } catch (error) {
        if (entry.entityId != null) {
          await collectionsRepository.markCollectionSyncError(entry.entityId);
        }

        await collectionsRepository.markSyncQueueFailure(
          entry.id,
          getErrorMessage(error),
        );
      }
    }
  },
};
