import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { getDatabase } from "../../database";
import { routePointsRepository } from "../routePointsRepository";
import type { RoutePointInput } from "../../../domain/types/routePoint";

jest.mock("../../database", () => ({
  getDatabase: jest.fn(),
}));

type MockDb = {
  runAsync: jest.Mock;
  getAllAsync: jest.Mock;
};

const mockedGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe("routePointsRepository", () => {
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
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("getAllRoutePoints deve mapear linhas e ordenar por prioridade e nome", async () => {
    mockDb.getAllAsync.mockResolvedValue([
      {
        id: 10,
        name: "Cooperativa Centro",
        latitude: -15.79,
        longitude: -47.88,
        material_preference: "papel",
        last_collected_at: "2026-04-25T10:00:00.000Z",
        priority: 3,
        created_at: "2026-04-20T09:00:00.000Z",
      },
    ] as never);

    const result = await routePointsRepository.getAllRoutePoints();
    const firstGetAllCall = mockDb.getAllAsync.mock.calls.at(0);

    expect(firstGetAllCall?.[0]).toContain("FROM route_points");
    expect(firstGetAllCall?.[0]).toContain("ORDER BY priority DESC, name ASC");
    expect(result).toEqual([
      {
        id: 10,
        name: "Cooperativa Centro",
        latitude: -15.79,
        longitude: -47.88,
        materialPreference: "papel",
        lastCollectedAt: "2026-04-25T10:00:00.000Z",
        priority: 3,
        createdAt: "2026-04-20T09:00:00.000Z",
      },
    ]);
  });

  it("insertRoutePoint deve persistir prioridade default e materialPreference null", async () => {
    jest
      .spyOn(Date.prototype, "toISOString")
      .mockReturnValue("2026-04-26T12:00:00.000Z");
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 88 } as never);

    const input: RoutePointInput = {
      name: "Mercado Central",
      latitude: -15.8,
      longitude: -47.9,
    };

    const result = await routePointsRepository.insertRoutePoint(input);
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(result).toEqual({ id: 88 });
    expect(firstRunCall?.[0]).toContain("INSERT INTO route_points");
    expect(firstRunCall?.[1]).toBe("Mercado Central");
    expect(firstRunCall?.[2]).toBe(-15.8);
    expect(firstRunCall?.[3]).toBe(-47.9);
    expect(firstRunCall?.[4]).toBeNull();
    expect(firstRunCall?.[5]).toBe(0);
    expect(firstRunCall?.[6]).toBe("2026-04-26T12:00:00.000Z");
  });

  it("insertRoutePoint deve preservar materialPreference e prioridade informados", async () => {
    mockDb.runAsync.mockResolvedValue({ lastInsertRowId: 89 } as never);

    await routePointsRepository.insertRoutePoint({
      name: "Galpao Sul",
      latitude: -15.81,
      longitude: -47.91,
      materialPreference: "metal",
      priority: 5,
    });
    const firstRunCall = mockDb.runAsync.mock.calls.at(0);

    expect(firstRunCall?.[4]).toBe("metal");
    expect(firstRunCall?.[5]).toBe(5);
  });

  it("updateLastCollected deve atualizar timestamp pelo id", async () => {
    mockDb.runAsync.mockResolvedValue({ changes: 1 } as never);

    await routePointsRepository.updateLastCollected(
      12,
      "2026-04-26T16:45:00.000Z",
    );

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      "UPDATE route_points SET last_collected_at = ? WHERE id = ?;",
      "2026-04-26T16:45:00.000Z",
      12,
    );
  });
});
