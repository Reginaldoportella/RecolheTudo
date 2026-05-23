import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { collectionsRepository } from "../collectionsRepository";
import type { CollectionInput } from "../../../domain/types/collection";
import { getDatabase } from "../../database";

jest.mock("../../database", () => ({
  getDatabase: jest.fn(),
}));

type MockDb = {
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  execAsync: jest.Mock;
};

const mockedGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe("collectionsRepository", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
      execAsync: jest.fn(),
    };

    mockedGetDatabase.mockResolvedValue(
      mockDb as unknown as Awaited<ReturnType<typeof getDatabase>>,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("insertCollection deve persistir e retornar id", async () => {
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 42 } as never);

    const input: CollectionInput = {
      material: "papel",
      weightRange: "medium",
      weightKg: 2.5,
      collectedAt: "2026-04-25T12:00:00.000Z",
      createdAt: "2026-04-25T12:00:00.000Z",
      latitude: -22.9,
      longitude: -43.2,
      locationAccuracy: 15,
      notes: "teste",
    };

    const result = await collectionsRepository.insertCollection(input);
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(result).toEqual({ id: 42 });
    expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
    expect(firstRunCall?.[1]).toBe("papel");
    expect(firstRunCall?.[2]).toBe("medium");
    expect(firstRunCall?.[3]).toBe(2.5);
    expect(firstRunCall?.[4]).toBe(2.5);
    expect(firstRunCall?.[5]).toBe(-22.9);
    expect(firstRunCall?.[6]).toBe(-43.2);
    expect(firstRunCall?.[7]).toBe(15);
    expect(firstRunCall?.[8]).toBe("2026-04-25T12:00:00.000Z");
    expect(firstRunCall?.[9]).toBe("2026-04-25T12:00:00.000Z");
    expect(firstRunCall?.[10]).toBe("teste");
    expect(firstRunCall?.[11]).toBeNull();
    expect(firstRunCall?.[12]).toBe("pending_sync");
    expect(firstRunCall?.[13]).toBeNull();
  });

  it("insertCollection deve converter latitude, longitude e notes ausentes para null", async () => {
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 7 } as never);

    const input: CollectionInput = {
      material: "vidro",
      weightRange: "small",
      weightKg: 1.25,
      collectedAt: "2026-04-25T13:30:00.000Z",
      createdAt: "2026-04-25T13:30:00.000Z",
    };

    await collectionsRepository.insertCollection(input);
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(firstRunCall?.[1]).toBe("vidro");
    expect(firstRunCall?.[2]).toBe("small");
    expect(firstRunCall?.[3]).toBe(1.25);
    expect(firstRunCall?.[4]).toBe(1.25);
    expect(firstRunCall?.[5]).toBeNull();
    expect(firstRunCall?.[6]).toBeNull();
    expect(firstRunCall?.[7]).toBeNull();
    expect(firstRunCall?.[8]).toBe("2026-04-25T13:30:00.000Z");
    expect(firstRunCall?.[9]).toBe("2026-04-25T13:30:00.000Z");
    expect(firstRunCall?.[10]).toBeNull();
    expect(firstRunCall?.[11]).toBeNull();
    expect(firstRunCall?.[12]).toBe("pending_sync");
    expect(firstRunCall?.[13]).toBeNull();
    expect(mockDb.runAsync).toHaveBeenCalledTimes(2);
  });

  it("getCollectionsByDate deve mapear linhas para Collection", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 1,
        material: "metal",
        weight_range: "large",
        weight_kg: 4,
        estimated_weight_kg: 4,
        latitude: null,
        longitude: null,
        location_accuracy: null,
        collected_at: "2026-04-25T08:00:00.000Z",
        created_at: "2026-04-25T08:00:00.000Z",
        notes: null,
        remote_id: "local-1",
        sync_status: "synced",
        last_synced_at: "2026-04-25T08:10:00.000Z",
      },
    ] as never);

    const result = await collectionsRepository.getCollectionsByDate("2026-04-25");

    expect(result).toEqual([
      {
        id: 1,
        material: "metal",
        weightRange: "large",
        weightKg: 4,
        latitude: null,
        longitude: null,
        locationAccuracy: null,
        collectedAt: "2026-04-25T08:00:00.000Z",
        createdAt: "2026-04-25T08:00:00.000Z",
        notes: null,
        remoteId: "local-1",
        syncStatus: "synced",
        lastSyncedAt: "2026-04-25T08:10:00.000Z",
      },
    ]);
  });

  it("getRecentCollections deve consultar por data de coleta com limit e offset", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 2,
        material: "plastico",
        weight_range: "medium",
        weight_kg: 6.5,
        estimated_weight_kg: 6.5,
        latitude: -23.1,
        longitude: -46.6,
        location_accuracy: 10,
        collected_at: "2026-04-26T09:00:00.000Z",
        created_at: "2026-04-26T09:00:00.000Z",
        notes: "rota norte",
        remote_id: null,
        sync_status: "pending_sync",
        last_synced_at: null,
      },
    ] as never);

    const result = await collectionsRepository.getRecentCollections(10, 20);
    const firstGetAllCall = mockDb.getAllAsync.mock.calls.at(0);

    expect(firstGetAllCall?.[0]).toContain("ORDER BY COALESCE(collected_at, created_at) DESC");
    expect(firstGetAllCall?.[0]).toContain("LIMIT ? OFFSET ?");
    expect(firstGetAllCall?.[1]).toBe(10);
    expect(firstGetAllCall?.[2]).toBe(20);
    expect(result).toEqual([
      {
        id: 2,
        material: "plastico",
        weightRange: "medium",
        weightKg: 6.5,
        latitude: -23.1,
        longitude: -46.6,
        locationAccuracy: 10,
        collectedAt: "2026-04-26T09:00:00.000Z",
        createdAt: "2026-04-26T09:00:00.000Z",
        notes: "rota norte",
        remoteId: null,
        syncStatus: "pending_sync",
        lastSyncedAt: null,
      },
    ]);
  });

  it("getDailySummary deve agregar totais por material", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      { material: "papel", total_kg: 3.2, collections_count: 2 },
      { material: "vidro", total_kg: 1.8, collections_count: 1 },
    ] as never);

    const summary = await collectionsRepository.getDailySummary("2026-04-25");

    expect(summary.date).toBe("2026-04-25");
    expect(summary.totalKg).toBeCloseTo(5);
    expect(summary.collectionsCount).toBe(3);
    expect(summary.byMaterial).toEqual({
      papel: 3.2,
      plastico: 0,
      metal: 0,
      vidro: 1.8,
      outros: 0,
    });
  });

  it("getWeeklySummary deve agregar os ultimos 7 dias", async () => {
    mockDb.getAllAsync
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        { material: "metal", total_kg: 4, collections_count: 1 },
      ] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        { material: "papel", total_kg: 6, collections_count: 2 },
      ] as never);

    const summary = await collectionsRepository.getWeeklySummary("2026-04-25");

    expect(summary.startDate).toBe("2026-04-19");
    expect(summary.endDate).toBe("2026-04-25");
    expect(summary.totalKg).toBe(10);
    expect(summary.collectionsCount).toBe(3);
    expect(summary.dailySummaries).toHaveLength(7);
  });

  it("deleteById deve remover uma coleta pelo id", async () => {
    mockDb.runAsync.mockResolvedValue(undefined as never);

    await collectionsRepository.deleteById(12);

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      "DELETE FROM collections WHERE id = ?;",
      12,
    );
  });

  it("getPendingSyncCount deve contar a fila local", async () => {
    mockDb.getFirstAsync.mockResolvedValue({ count: 3 } as never);

    const count = await collectionsRepository.getPendingSyncCount();

    expect(count).toBe(3);
  });
});
