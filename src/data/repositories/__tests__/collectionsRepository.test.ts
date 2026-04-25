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
};

const mockedGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe("collectionsRepository", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      runAsync: jest.fn(),
      getAllAsync: jest.fn(),
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
      weightKg: 2.5,
      createdAt: "2026-04-25T12:00:00.000Z",
      latitude: -22.9,
      longitude: -43.2,
      notes: "teste",
    };

    const result = await collectionsRepository.insertCollection(input);
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(result).toEqual({ id: 42 });
    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    expect(firstRunCall?.[1]).toBe("papel");
    expect(firstRunCall?.[2]).toBe(2.5);
  });

  it("getCollectionsByDate deve mapear linhas para Collection", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 1,
        material: "metal",
        weight_kg: 4,
        latitude: null,
        longitude: null,
        created_at: "2026-04-25T08:00:00.000Z",
        notes: null,
      },
    ] as never);

    const result = await collectionsRepository.getCollectionsByDate("2026-04-25");

    expect(result).toEqual([
      {
        id: 1,
        material: "metal",
        weightKg: 4,
        latitude: null,
        longitude: null,
        createdAt: "2026-04-25T08:00:00.000Z",
        notes: null,
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
});
