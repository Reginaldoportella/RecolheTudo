import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  mapOverpassResponseToCollectionPoints,
  overpassRecyclingDatasource,
} from "../overpass-recycling.datasource";

const overpassResponse = {
  elements: [
    {
      type: "node" as const,
      id: 123,
      lat: -23.55,
      lon: -46.63,
      tags: {
        name: "Ecoponto Central",
        "addr:street": "Rua Verde",
        "addr:housenumber": "100",
        "addr:city": "Sao Paulo",
        "recycling:paper": "yes",
        "recycling:glass": "yes",
      },
    },
  ],
};

function fetchMock(): jest.MockedFunction<typeof fetch> {
  return global.fetch as jest.MockedFunction<typeof fetch>;
}

function mockFetchJsonResponse(body: unknown, ok = true, status = 200): void {
  fetchMock().mockResolvedValue({
    ok,
    status,
    json: jest.fn<() => Promise<unknown>>().mockResolvedValue(body),
  } as unknown as Response);
}

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe("overpassRecyclingDatasource mapper", () => {
  it("deve mapear resposta Overpass para CollectionPoint", () => {
    const points = mapOverpassResponseToCollectionPoints(
      overpassResponse,
      "2026-05-08T10:00:00.000Z",
    );

    expect(points).toEqual([
      {
        id: "osm:node/123",
        name: "Ecoponto Central",
        address: "Rua Verde, 100 - Sao Paulo",
        latitude: -23.55,
        longitude: -46.63,
        materialType: "paper,glass",
        source: "osm",
        externalId: "node/123",
        createdAt: "2026-05-08T10:00:00.000Z",
      },
    ]);
  });

  it("deve ignorar elementos sem coordenadas", () => {
    const points = mapOverpassResponseToCollectionPoints({
      elements: [{ type: "way", id: 456, tags: { name: "Sem centro" } }],
    });

    expect(points).toEqual([]);
  });

  it("deve mapear elements com center para CollectionPoint", () => {
    const points = mapOverpassResponseToCollectionPoints(
      {
        elements: [
          {
            type: "way",
            id: 456,
            center: {
              lat: -23.56,
              lon: -46.64,
            },
            tags: {
              operator: "Cooperativa Verde",
              "recycling:plastic": "yes",
              "recycling:metal": "yes",
            },
          },
        ],
      },
      "2026-05-08T10:00:00.000Z",
    );

    expect(points).toEqual([
      {
        id: "osm:way/456",
        name: "Cooperativa Verde",
        address: null,
        latitude: -23.56,
        longitude: -46.64,
        materialType: "plastic,metal",
        source: "osm",
        externalId: "way/456",
        createdAt: "2026-05-08T10:00:00.000Z",
      },
    ]);
  });
});

describe("overpassRecyclingDatasource", () => {
  it("deve buscar pontos próximos usando resposta mockada da Overpass", async () => {
    mockFetchJsonResponse(overpassResponse);

    const result = await overpassRecyclingDatasource.findNearby(
      -23.55,
      -46.63,
      3000,
    );

    expect(fetchMock()).toHaveBeenCalledTimes(1);
    expect(fetchMock()).toHaveBeenCalledWith(
      "https://overpass-api.de/api/interpreter",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
      }),
    );

    const requestInit = fetchMock().mock.calls[0]?.[1];
    const body = new URLSearchParams(String(requestInit?.body));
    expect(body.get("data")).toContain("around:3000,-23.55,-46.63");
    expect(result).toEqual([
      expect.objectContaining({
        id: "osm:node/123",
        name: "Ecoponto Central",
        latitude: -23.55,
        longitude: -46.63,
      }),
    ]);
  });

  it("deve retornar array vazio quando a Overpass responder sem elementos", async () => {
    mockFetchJsonResponse({ elements: [] });

    const result = await overpassRecyclingDatasource.findNearby(
      -23.55,
      -46.63,
      3000,
    );

    expect(result).toEqual([]);
  });

  it("deve propagar erro de rede sem aguardar timeout real", async () => {
    fetchMock().mockRejectedValue(new Error("network timeout"));

    await expect(
      overpassRecyclingDatasource.findNearby(-23.55, -46.63, 3000),
    ).rejects.toThrow("network timeout");
  });

  it("deve lançar erro quando a Overpass responder com erro HTTP", async () => {
    mockFetchJsonResponse({ elements: [] }, false, 429);

    await expect(
      overpassRecyclingDatasource.findNearby(-23.55, -46.63, 3000),
    ).rejects.toThrow("Overpass request failed with status 429");
  });
});
