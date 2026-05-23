import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { collectionsSyncService } from "../collectionsSyncService";
import { collectionsRepository } from "../../data/repositories/collectionsRepository";
import { backendService } from "../backendService";
import { deviceIdentityService } from "../deviceIdentityService";

jest.mock("../../data/repositories/collectionsRepository", () => ({
  collectionsRepository: {
    getPendingSyncQueue: jest.fn(),
    getLastSyncedAt: jest.fn(),
    markCollectionAsSynced: jest.fn(),
    markCollectionSyncError: jest.fn(),
    markSyncQueueFailure: jest.fn(),
    deleteSyncQueueEntry: jest.fn(),
    upsertCollectionFromRemote: jest.fn(),
    deleteByRemoteId: jest.fn(),
  },
}));

jest.mock("../backendService", () => ({
  backendService: {
    syncEntities: jest.fn(),
  },
}));

jest.mock("../deviceIdentityService", () => ({
  deviceIdentityService: {
    getDeviceId: jest.fn(),
  },
}));

const mockedCollectionsRepository = collectionsRepository as jest.Mocked<
  typeof collectionsRepository
>;
const mockedBackendService = backendService as jest.Mocked<typeof backendService>;
const mockedDeviceIdentityService = deviceIdentityService as jest.Mocked<
  typeof deviceIdentityService
>;

describe("collectionsSyncService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDeviceIdentityService.getDeviceId.mockResolvedValue("device_local");
    mockedCollectionsRepository.getLastSyncedAt.mockResolvedValue(
      "2026-05-20T10:00:00.000Z",
    );
  });

  it("processPendingQueue envia created e deleted pelo novo endpoint e limpa a fila em sucesso", async () => {
    mockedCollectionsRepository.getPendingSyncQueue.mockResolvedValue([
      {
        id: 1,
        entityId: 7,
        operation: "upsert",
        payload: JSON.stringify({
          localId: 7,
          remoteId: "local-7",
          material: "papel",
          weightKg: 2.5,
          collectedAt: "2026-05-20T09:00:00.000Z",
          createdAt: "2026-05-20T09:00:00.000Z",
          latitude: null,
          longitude: null,
          locationAccuracy: null,
          notes: null,
        }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        createdAt: "2026-05-20T09:00:00.000Z",
      },
      {
        id: 2,
        entityId: 8,
        operation: "delete",
        payload: JSON.stringify({
          remoteId: "srv-8",
        }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        createdAt: "2026-05-20T09:05:00.000Z",
      },
    ]);

    mockedBackendService.syncEntities.mockResolvedValue({
      requestDeviceId: "device_local",
      syncAt: "2026-05-20T11:00:00.000Z",
      accepted: {
        collections: {
          created: [
            {
              localId: 7,
              remoteId: "srv-7",
              material: "papel",
              weightKg: 2.5,
              collectedAt: "2026-05-20T09:00:00.000Z",
              createdAt: "2026-05-20T09:00:00.000Z",
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
      rejected: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
      conflicts: {
        collections: [],
      },
      pull: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
    });

    await collectionsSyncService.processPendingQueue();

    expect(mockedBackendService.syncEntities).toHaveBeenCalledTimes(1);
    const payload = mockedBackendService.syncEntities.mock.calls[0]?.[0];
    expect(payload?.deviceId).toBe("device_local");
    expect(payload?.changes.collections.created).toHaveLength(1);
    expect(payload?.changes.collections.deleted).toHaveLength(1);

    expect(mockedCollectionsRepository.markCollectionAsSynced).toHaveBeenCalledWith(
      7,
      "srv-7",
      "2026-05-20T11:00:00.000Z",
    );
    expect(mockedCollectionsRepository.deleteSyncQueueEntry).toHaveBeenCalledWith(1);
    expect(mockedCollectionsRepository.deleteSyncQueueEntry).toHaveBeenCalledWith(2);
  });

  it("processPendingQueue aplica pull remoto de outro device", async () => {
    mockedCollectionsRepository.getPendingSyncQueue.mockResolvedValue([
      {
        id: 1,
        entityId: 7,
        operation: "upsert",
        payload: JSON.stringify({
          localId: 7,
          remoteId: "local-7",
          material: "papel",
          weightKg: 2.5,
          collectedAt: "2026-05-20T09:00:00.000Z",
          createdAt: "2026-05-20T09:00:00.000Z",
          latitude: null,
          longitude: null,
          locationAccuracy: null,
          notes: null,
        }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        createdAt: "2026-05-20T09:00:00.000Z",
      },
    ]);

    mockedBackendService.syncEntities.mockResolvedValue({
      requestDeviceId: "device_local",
      syncAt: "2026-05-20T11:00:00.000Z",
      accepted: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
      rejected: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
      conflicts: {
        collections: [],
      },
      pull: {
        collections: {
          created: [
            {
              localId: "99",
              remoteId: "srv-99",
              userId: null,
              deviceId: "device_remote",
              material: "metal",
              weightKg: 3,
              collectedAt: "2026-05-20T08:00:00.000Z",
              createdAt: "2026-05-20T08:00:00.000Z",
              updatedAt: "2026-05-20T08:10:00.000Z",
              deletedAt: null,
              latitude: null,
              longitude: null,
              locationAccuracy: null,
              notes: "remoto",
            },
          ],
          updated: [],
          deleted: [{ remoteId: "srv-delete" }],
        },
      },
    });

    await collectionsSyncService.processPendingQueue();

    expect(
      mockedCollectionsRepository.upsertCollectionFromRemote,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        remoteId: "srv-99",
        deviceId: "device_remote",
      }),
      "2026-05-20T11:00:00.000Z",
    );
    expect(mockedCollectionsRepository.deleteByRemoteId).toHaveBeenCalledWith(
      "srv-delete",
    );
  });

  it("processPendingQueue preserva fila e marca erro quando houver rejeicao parcial", async () => {
    mockedCollectionsRepository.getPendingSyncQueue.mockResolvedValue([
      {
        id: 1,
        entityId: 7,
        operation: "upsert",
        payload: JSON.stringify({
          localId: 7,
          remoteId: "local-7",
          material: "papel",
          weightKg: 2.5,
          collectedAt: "2026-05-20T09:00:00.000Z",
          createdAt: "2026-05-20T09:00:00.000Z",
          latitude: null,
          longitude: null,
          locationAccuracy: null,
          notes: null,
        }),
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        createdAt: "2026-05-20T09:00:00.000Z",
      },
    ]);

    mockedBackendService.syncEntities.mockResolvedValue({
      requestDeviceId: "device_local",
      syncAt: "2026-05-20T11:00:00.000Z",
      accepted: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
      rejected: {
        collections: {
          created: [{ code: "INVALID", message: "payload invalido" }],
          updated: [],
          deleted: [],
        },
      },
      conflicts: {
        collections: [],
      },
      pull: {
        collections: {
          created: [],
          updated: [],
          deleted: [],
        },
      },
    });

    await collectionsSyncService.processPendingQueue();

    expect(mockedCollectionsRepository.markCollectionSyncError).toHaveBeenCalledWith(
      7,
    );
    expect(mockedCollectionsRepository.markSyncQueueFailure).toHaveBeenCalledWith(
      1,
      "payload invalido",
    );
    expect(mockedCollectionsRepository.deleteSyncQueueEntry).not.toHaveBeenCalled();
  });
});
