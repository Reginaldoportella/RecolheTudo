import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { collectionsService } from "../collectionsService";
import { collectionsRepository } from "../../data/repositories/collectionsRepository";
import { backendService } from "../backendService";

jest.mock("../../data/repositories/collectionsRepository", () => ({
  collectionsRepository: {
    getDailySummary: jest.fn(),
    getWeeklySummary: jest.fn(),
  },
}));

jest.mock("../backendService", () => ({
  backendService: {
    getAnalyticsSummary: jest.fn(),
    getAnalyticsMaterials: jest.fn(),
    getAnalyticsProductivity: jest.fn(),
  },
}));

const mockedCollectionsRepository = collectionsRepository as jest.Mocked<
  typeof collectionsRepository
>;
const mockedBackendService = backendService as jest.Mocked<typeof backendService>;

describe("collectionsService analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("usa backend para resumo diario quando disponivel", async () => {
    mockedBackendService.getAnalyticsSummary.mockResolvedValue({
      date: "2026-05-20",
      totalKg: 3,
      byMaterial: {
        papel: 3,
        plastico: 0,
        metal: 0,
        vidro: 0,
        outros: 0,
      },
      collectionsCount: 2,
    });

    const result = await collectionsService.getDailySummary("2026-05-20");

    expect(result.totalKg).toBe(3);
    expect(mockedCollectionsRepository.getDailySummary).not.toHaveBeenCalled();
  });

  it("cai para SQLite quando backend falha", async () => {
    mockedBackendService.getAnalyticsSummary.mockRejectedValue(new Error("offline"));
    mockedCollectionsRepository.getWeeklySummary.mockResolvedValue({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
      totalKg: 8,
      collectionsCount: 4,
      dailySummaries: [],
    });

    const result = await collectionsService.getWeeklySummary("2026-05-20");

    expect(result.totalKg).toBe(8);
    expect(mockedCollectionsRepository.getWeeklySummary).toHaveBeenCalledWith(
      "2026-05-20",
    );
  });

  it("monta materials summary local quando a API falha", async () => {
    mockedBackendService.getAnalyticsMaterials.mockRejectedValue(new Error("offline"));
    mockedCollectionsRepository.getDailySummary.mockResolvedValue({
      date: "2026-05-20",
      totalKg: 4,
      byMaterial: {
        papel: 1.5,
        plastico: 2.5,
        metal: 0,
        vidro: 0,
        outros: 0,
      },
      collectionsCount: 2,
    });

    const result = await collectionsService.getMaterialsSummary("daily", "2026-05-20");

    expect(result.items).toEqual([
      { material: "papel", totalKg: 1.5, collectionsCount: 0 },
      { material: "plastico", totalKg: 2.5, collectionsCount: 0 },
    ]);
  });

  it("monta productivity summary local quando a API falha", async () => {
    mockedBackendService.getAnalyticsProductivity.mockRejectedValue(
      new Error("offline"),
    );
    mockedCollectionsRepository.getWeeklySummary.mockResolvedValue({
      startDate: "2026-05-14",
      endDate: "2026-05-20",
      totalKg: 8,
      collectionsCount: 4,
      dailySummaries: [
        {
          date: "2026-05-19",
          totalKg: 3,
          byMaterial: {
            papel: 3,
            plastico: 0,
            metal: 0,
            vidro: 0,
            outros: 0,
          },
          collectionsCount: 2,
        },
        {
          date: "2026-05-20",
          totalKg: 5,
          byMaterial: {
            papel: 1,
            plastico: 4,
            metal: 0,
            vidro: 0,
            outros: 0,
          },
          collectionsCount: 2,
        },
      ],
    });

    const result = await collectionsService.getProductivitySummary(
      "weekly",
      "2026-05-20",
    );

    expect(result.points).toEqual([
      { date: "2026-05-19", totalKg: 3, collectionsCount: 2 },
      { date: "2026-05-20", totalKg: 5, collectionsCount: 2 },
    ]);
  });
});
