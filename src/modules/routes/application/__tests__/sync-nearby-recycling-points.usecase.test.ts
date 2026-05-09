import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { syncNearbyRecyclingPointsUseCase } from "../sync-nearby-recycling-points.usecase";
import type { CollectionPointsRepository } from "../../data/collection-points.repository";
import type { RecyclingPointsDatasource } from "../../data/overpass-recycling.datasource";
import type { CollectionPoint } from "../../domain/collection-point.entity";

const cachedPoint: CollectionPoint = {
  id: "manual-1",
  name: "Cache local",
  address: null,
  latitude: -23.55,
  longitude: -46.63,
  materialType: null,
  source: "manual",
  externalId: null,
  createdAt: "2026-05-08T10:00:00.000Z",
};

function createDatasourceMock(
  points: CollectionPoint[] = [cachedPoint],
): RecyclingPointsDatasource {
  return {
    findNearby: jest
      .fn<RecyclingPointsDatasource["findNearby"]>()
      .mockResolvedValue(points),
  };
}

function createRepositoryMock(
  cachedPoints: CollectionPoint[] = [],
): CollectionPointsRepository {
  return {
    upsertMany: jest.fn<CollectionPointsRepository["upsertMany"]>().mockResolvedValue(),
    create: jest.fn<CollectionPointsRepository["create"]>().mockResolvedValue(),
    createManual: jest.fn<CollectionPointsRepository["createManual"]>().mockResolvedValue(),
    findAll: jest.fn<CollectionPointsRepository["findAll"]>().mockResolvedValue([]),
    findNearby: jest
      .fn<CollectionPointsRepository["findNearby"]>()
      .mockResolvedValue(cachedPoints),
    deleteById: jest.fn<CollectionPointsRepository["deleteById"]>().mockResolvedValue(),
  };
}

describe("syncNearbyRecyclingPointsUseCase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve salvar e retornar pontos remotos quando API responder", async () => {
    const datasource = createDatasourceMock([cachedPoint]);
    const repository = createRepositoryMock();

    const result = await syncNearbyRecyclingPointsUseCase(
      -23.55,
      -46.63,
      3000,
      datasource,
      repository,
    );

    expect(datasource.findNearby).toHaveBeenCalledWith(-23.55, -46.63, 3000);
    expect(repository.upsertMany).toHaveBeenCalledWith([cachedPoint]);
    expect(repository.findNearby).not.toHaveBeenCalled();
    expect(result).toEqual({ points: [cachedPoint], fromCache: false });
  });

  it("deve retornar pontos locais quando API falhar", async () => {
    const datasource: RecyclingPointsDatasource = {
      findNearby: jest
        .fn<RecyclingPointsDatasource["findNearby"]>()
        .mockRejectedValue(new Error("offline")),
    };
    const repository = createRepositoryMock([cachedPoint]);

    const result = await syncNearbyRecyclingPointsUseCase(
      -23.55,
      -46.63,
      3000,
      datasource,
      repository,
    );

    expect(repository.findNearby).toHaveBeenCalledWith(-23.55, -46.63, 3000);
    expect(repository.upsertMany).not.toHaveBeenCalled();
    expect(result).toEqual({ points: [cachedPoint], fromCache: true });
  });

  it("deve retornar cache vazio quando API falhar e nao houver pontos locais", async () => {
    const datasource: RecyclingPointsDatasource = {
      findNearby: jest
        .fn<RecyclingPointsDatasource["findNearby"]>()
        .mockRejectedValue(new Error("offline")),
    };
    const repository = createRepositoryMock([]);

    const result = await syncNearbyRecyclingPointsUseCase(
      -23.55,
      -46.63,
      3000,
      datasource,
      repository,
    );

    expect(repository.findNearby).toHaveBeenCalledWith(-23.55, -46.63, 3000);
    expect(repository.upsertMany).not.toHaveBeenCalled();
    expect(result).toEqual({ points: [], fromCache: true });
  });
});
