import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { collectionPointsRepository } from "../collectionPointsRepository";
import { getDatabase } from "../../database";
import type { CollectionPoint } from "../../../domain/types/collectionPoint";

jest.mock("../../database", () => ({
  getDatabase: jest.fn(),
}));

type MockDb = {
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
};

const mockedGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe("collectionPointsRepository", () => {
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

  it("upsertMany deve persistir pontos com source e externalId", async () => {
    const points: CollectionPoint[] = [
      {
        id: "osm:node/1",
        name: "Ponto OSM",
        address: null,
        latitude: -23.55,
        longitude: -46.63,
        materialType: "paper",
        source: "osm",
        externalId: "node/1",
        createdAt: "2026-05-08T10:00:00.000Z",
      },
    ];

    await collectionPointsRepository.upsertMany(points);
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    expect(firstRunCall?.[0]).toContain("ON CONFLICT(id) DO UPDATE");
    expect(firstRunCall?.[1]).toBe("osm:node/1");
    expect(firstRunCall?.[7]).toBe("osm");
    expect(firstRunCall?.[8]).toBe("node/1");
  });

  it("createManual deve criar ponto manual", async () => {
    await collectionPointsRepository.createManual({
      id: "manual-1",
      name: "Cooperativa",
      latitude: -23.56,
      longitude: -46.64,
      createdAt: "2026-05-08T10:00:00.000Z",
    });
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(firstRunCall?.[0]).toContain("INSERT INTO collection_points");
    expect(firstRunCall?.[1]).toBe("manual-1");
    expect(firstRunCall?.[7]).toBe("manual");
    expect(firstRunCall?.[8]).toBeNull();
  });

  it("findAll deve mapear linhas para CollectionPoint", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: "osm:node/2",
        name: "Ecoponto",
        address: "Rua A",
        latitude: -23.55,
        longitude: -46.63,
        material_type: null,
        source: "osm",
        external_id: "node/2",
        created_at: "2026-05-08T10:00:00.000Z",
      },
    ] as never);

    const result = await collectionPointsRepository.findAll();

    expect(result).toEqual([
      {
        id: "osm:node/2",
        name: "Ecoponto",
        address: "Rua A",
        latitude: -23.55,
        longitude: -46.63,
        materialType: null,
        source: "osm",
        externalId: "node/2",
        createdAt: "2026-05-08T10:00:00.000Z",
      },
    ]);
  });

  it("findNearby deve filtrar por raio em metros", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: "near",
        name: "Perto",
        address: null,
        latitude: 0,
        longitude: 0.005,
        material_type: null,
        source: "manual",
        external_id: null,
        created_at: "2026-05-08T10:00:00.000Z",
      },
      {
        id: "far",
        name: "Longe",
        address: null,
        latitude: 0,
        longitude: 1,
        material_type: null,
        source: "manual",
        external_id: null,
        created_at: "2026-05-08T10:00:00.000Z",
      },
    ] as never);

    const result = await collectionPointsRepository.findNearby(0, 0, 1000);

    expect(result.map((point) => point.id)).toEqual(["near"]);
  });

  it("deleteById deve remover por id", async () => {
    await collectionPointsRepository.deleteById("manual-1");

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      "DELETE FROM collection_points WHERE id = ?;",
      "manual-1",
    );
  });
});
