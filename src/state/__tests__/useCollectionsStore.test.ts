import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { useCollectionsStore } from "../useCollectionsStore";
import { collectionsService } from "../../services/collectionsService";
import { collectionsSyncService } from "../../services/collectionsSyncService";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock("../../services/collectionsService", () => ({
  collectionsService: {
    createCollection: jest.fn(),
    getAllCollections: jest.fn(),
    getDailySummary: jest.fn(),
    getWeeklySummary: jest.fn(),
    getCollectionsByDate: jest.fn(),
    getCollectionsByDateRange: jest.fn(),
    getRecentCollections: jest.fn(),
    deleteCollection: jest.fn(),
  },
}));

jest.mock("../../services/collectionsSyncService", () => ({
  collectionsSyncService: {
    processPendingQueue: jest.fn(),
  },
}));

const mockedCollectionsService = collectionsService as jest.Mocked<
  typeof collectionsService
>;
const mockedCollectionsSyncService = collectionsSyncService as jest.Mocked<
  typeof collectionsSyncService
>;

const initialState = useCollectionsStore.getState();

describe("useCollectionsStore", () => {
  beforeEach(() => {
    useCollectionsStore.setState(initialState, true);
    jest.clearAllMocks();
  });

  afterEach(() => {
    useCollectionsStore.setState(initialState, true);
  });

  it("loadHistory deve carregar historico com status success", async () => {
    mockedCollectionsService.getRecentCollections.mockResolvedValue([
      {
        id: 1,
        material: "papel",
        weightRange: "medium",
        weightKg: 2.5,
        latitude: null,
        longitude: null,
        locationAccuracy: null,
        collectedAt: "2026-05-13T10:00:00.000Z",
        createdAt: "2026-05-13T10:00:00.000Z",
        notes: null,
        remoteId: "local-1",
        syncStatus: "synced",
        lastSyncedAt: "2026-05-13T10:01:00.000Z",
      },
    ]);

    await useCollectionsStore.getState().loadHistory(50, 0);

    const state = useCollectionsStore.getState();
    expect(mockedCollectionsService.getRecentCollections).toHaveBeenCalledWith(50, 0);
    expect(state.history).toHaveLength(1);
    expect(state.historyStatus).toBe("success");
  });

  it("loadHistory deve marcar empty quando nao houver registros", async () => {
    mockedCollectionsService.getRecentCollections.mockResolvedValue([]);

    await useCollectionsStore.getState().loadHistory(20, 0);

    const state = useCollectionsStore.getState();
    expect(state.history).toEqual([]);
    expect(state.historyStatus).toBe("empty");
  });

  it("deleteCollection deve excluir registro, invalidar resumo e recarregar historico", async () => {
    mockedCollectionsService.getRecentCollections
      .mockResolvedValueOnce([
        {
          id: 9,
          material: "metal",
          weightRange: "large",
          weightKg: 8,
          latitude: null,
          longitude: null,
          locationAccuracy: null,
          collectedAt: "2026-05-13T09:00:00.000Z",
          createdAt: "2026-05-13T09:00:00.000Z",
          notes: null,
          remoteId: "local-9",
          syncStatus: "synced",
          lastSyncedAt: "2026-05-13T09:01:00.000Z",
        },
      ])
      .mockResolvedValueOnce([]);

    mockedCollectionsService.getDailySummary.mockResolvedValue({
      date: "2026-05-13",
      totalKg: 0,
      byMaterial: {
        papel: 0,
        plastico: 0,
        metal: 0,
        vidro: 0,
        outros: 0,
      },
      collectionsCount: 0,
    });

    mockedCollectionsService.getWeeklySummary.mockResolvedValue({
      startDate: "2026-05-07",
      endDate: "2026-05-13",
      totalKg: 0,
      collectionsCount: 0,
      dailySummaries: [],
    });

    mockedCollectionsService.deleteCollection.mockResolvedValue();
    mockedCollectionsSyncService.processPendingQueue.mockResolvedValue();

    await useCollectionsStore.getState().loadHistory(50, 0);
    await useCollectionsStore.getState().deleteCollection(9);

    const state = useCollectionsStore.getState();
    expect(mockedCollectionsService.deleteCollection).toHaveBeenCalledWith(9);
    expect(mockedCollectionsService.getDailySummary).toHaveBeenCalledWith("2026-05-13");
    expect(mockedCollectionsService.getWeeklySummary).toHaveBeenCalledWith("2026-05-13");
    expect(mockedCollectionsService.getRecentCollections).toHaveBeenCalledTimes(2);
    expect(mockedCollectionsSyncService.processPendingQueue).toHaveBeenCalled();
    expect(state.history).toEqual([]);
    expect(state.collectionStatus).toBe("success");
  });
});
