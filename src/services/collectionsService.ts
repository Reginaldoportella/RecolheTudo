import { collectionsRepository } from "../data/repositories/collectionsRepository";
import type {
  Collection,
  CollectionInput,
  DailySummary,
  Material,
  MaterialsSummary,
  ProductivitySummary,
  SummaryByMaterial,
  WeeklySummary,
} from "../domain/types/collection";
import { backendService } from "./backendService";
import { validateCollection } from "../validation/collectionValidation";

function emptyByMaterial(): SummaryByMaterial {
  return {
    papel: 0,
    plastico: 0,
    metal: 0,
    vidro: 0,
    outros: 0,
  };
}

function buildMaterialsSummaryFromDaily(summary: DailySummary): MaterialsSummary {
  const items = (Object.entries(summary.byMaterial) as Array<[Material, number]>)
    .filter(([, totalKg]) => totalKg > 0)
    .map(([material, totalKg]) => ({
      material,
      totalKg,
      collectionsCount: 0,
    }));

  return {
    period: "daily",
    startDate: summary.date,
    endDate: summary.date,
    items,
  };
}

function buildMaterialsSummaryFromWeekly(summary: WeeklySummary): MaterialsSummary {
  const totals = summary.dailySummaries.reduce<SummaryByMaterial>((acc, day) => {
    acc.papel += day.byMaterial.papel;
    acc.plastico += day.byMaterial.plastico;
    acc.metal += day.byMaterial.metal;
    acc.vidro += day.byMaterial.vidro;
    acc.outros += day.byMaterial.outros;
    return acc;
  }, emptyByMaterial());

  const items = (Object.entries(totals) as Array<[Material, number]>)
    .filter(([, totalKg]) => totalKg > 0)
    .map(([material, totalKg]) => ({
      material,
      totalKg,
      collectionsCount: 0,
    }));

  return {
    period: "weekly",
    startDate: summary.startDate,
    endDate: summary.endDate,
    items,
  };
}

function buildProductivitySummaryFromDaily(summary: DailySummary): ProductivitySummary {
  return {
    period: "daily",
    startDate: summary.date,
    endDate: summary.date,
    points: [
      {
        date: summary.date,
        totalKg: summary.totalKg,
        collectionsCount: summary.collectionsCount,
      },
    ],
  };
}

function buildProductivitySummaryFromWeekly(summary: WeeklySummary): ProductivitySummary {
  return {
    period: "weekly",
    startDate: summary.startDate,
    endDate: summary.endDate,
    points: summary.dailySummaries.map((day) => ({
      date: day.date,
      totalKg: day.totalKg,
      collectionsCount: day.collectionsCount,
    })),
  };
}

export const collectionsService = {
  async createCollection(input: CollectionInput): Promise<{ id: number }> {
    validateCollection(input);
    return collectionsRepository.insertCollection(input);
  },

  async getAllCollections(): Promise<Collection[]> {
    return collectionsRepository.getAllCollections();
  },

  async getDailySummary(date: string): Promise<DailySummary> {
    try {
      const backendSummary = await backendService.getAnalyticsSummary("daily", date);

      if (backendSummary) {
        return backendSummary as DailySummary;
      }
    } catch {
      // Keep offline-first behavior and fall back to SQLite when the API is unavailable.
    }

    return collectionsRepository.getDailySummary(date);
  },

  async getWeeklySummary(referenceDate: string): Promise<WeeklySummary> {
    try {
      const backendSummary = await backendService.getAnalyticsSummary(
        "weekly",
        referenceDate,
      );

      if (backendSummary) {
        return backendSummary as WeeklySummary;
      }
    } catch {
      // Keep offline-first behavior and fall back to SQLite when the API is unavailable.
    }

    return collectionsRepository.getWeeklySummary(referenceDate);
  },

  async getMaterialsSummary(
    period: "daily" | "weekly",
    referenceDate: string,
  ): Promise<MaterialsSummary> {
    try {
      const backendSummary = await backendService.getAnalyticsMaterials(
        period,
        referenceDate,
      );

      if (backendSummary) {
        return backendSummary;
      }
    } catch {
      // Keep offline-first behavior and compute locally when the API is unavailable.
    }

    if (period === "daily") {
      const summary = await collectionsService.getDailySummary(referenceDate);
      return buildMaterialsSummaryFromDaily(summary);
    }

    const summary = await collectionsService.getWeeklySummary(referenceDate);
    return buildMaterialsSummaryFromWeekly(summary);
  },

  async getProductivitySummary(
    period: "daily" | "weekly",
    referenceDate: string,
  ): Promise<ProductivitySummary> {
    try {
      const backendSummary = await backendService.getAnalyticsProductivity(
        period,
        referenceDate,
      );

      if (backendSummary) {
        return backendSummary;
      }
    } catch {
      // Keep offline-first behavior and compute locally when the API is unavailable.
    }

    if (period === "daily") {
      const summary = await collectionsService.getDailySummary(referenceDate);
      return buildProductivitySummaryFromDaily(summary);
    }

    const summary = await collectionsService.getWeeklySummary(referenceDate);
    return buildProductivitySummaryFromWeekly(summary);
  },

  async getCollectionsByDate(date: string): Promise<Collection[]> {
    return collectionsRepository.getCollectionsByDate(date);
  },

  async getCollectionsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Collection[]> {
    return collectionsRepository.getCollectionsByDateRange(startDate, endDate);
  },

  async getRecentCollections(
    limit: number,
    offset: number,
  ): Promise<Collection[]> {
    return collectionsRepository.getRecentCollections(limit, offset);
  },

  async deleteCollection(id: number): Promise<void> {
    const target = await collectionsRepository.getCollectionById(id);

    if (target?.remoteId) {
      await collectionsRepository.enqueueDeleteSync(target.remoteId, id);
    } else {
      await collectionsRepository.deleteQueuedUpsertsByCollectionId(id);
    }

    await collectionsRepository.deleteById(id);
  },
};
