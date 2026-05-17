import { create } from "zustand";
import * as Location from "expo-location";
import type {
  Collection,
  CollectionInput,
  DailySummary,
  WeeklySummary,
} from "../domain/types/collection";
import { collectionsService } from "../services/collectionsService";
import { collectionsSyncService } from "../services/collectionsSyncService";

type UIStatus =
  | "idle"
  | "loading"
  | "empty"
  | "success"
  | "error"
  | "permission_denied";

interface RegisterResult {
  status: "success" | "permission_denied";
}

interface CollectionsStoreState {
  dailySummaryByDate: Record<string, DailySummary>;
  weeklySummaryByDate: Record<string, WeeklySummary>;
  history: Collection[];
  homeStatus: UIStatus;
  collectionStatus: UIStatus;
  historyStatus: UIStatus;
  errorMessage: string | null;
  loadHome: (date: string) => Promise<void>;
  loadDashboard: (date: string) => Promise<void>;
  registerCollection: (input: CollectionInput) => Promise<RegisterResult>;
  loadHistory: (limit?: number, offset?: number) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  invalidateDate: (date: string) => void;
  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro inesperado ao processar operacao";
}

function runBestEffortSync(task: Promise<unknown>): void {
  void task.catch(() => {
    // The local SQLite flow remains the source of truth while offline or when the backend is down.
  });
}

export const useCollectionsStore = create<CollectionsStoreState>((set, get) => ({
  dailySummaryByDate: {},
  weeklySummaryByDate: {},
  history: [],
  homeStatus: "idle",
  collectionStatus: "idle",
  historyStatus: "idle",
  errorMessage: null,

  async loadHome(date) {
    await get().loadDashboard(date);
  },

  async loadDashboard(date) {
    const cachedSummary = get().dailySummaryByDate[date];
    const cachedWeeklySummary = get().weeklySummaryByDate[date];

    if (cachedSummary && cachedWeeklySummary) {
      set({
        homeStatus: cachedSummary.collectionsCount === 0 ? "empty" : "success",
      });
      return;
    }

    set({ homeStatus: "loading", errorMessage: null });

    try {
      const [summary, weeklySummary] = await Promise.all([
        collectionsService.getDailySummary(date),
        collectionsService.getWeeklySummary(date),
      ]);

      set((state) => ({
        dailySummaryByDate: {
          ...state.dailySummaryByDate,
          [date]: summary,
        },
        weeklySummaryByDate: {
          ...state.weeklySummaryByDate,
          [date]: weeklySummary,
        },
        homeStatus: summary.collectionsCount === 0 ? "empty" : "success",
      }));
    } catch (error) {
      set({
        homeStatus: "error",
        errorMessage: getErrorMessage(error),
      });
    }
  },

  async registerCollection(input) {
    set({ collectionStatus: "loading", errorMessage: null });

    try {
      let latitude = input.latitude ?? null;
      let longitude = input.longitude ?? null;
      let locationAccuracy = input.locationAccuracy ?? null;
      let permissionDenied = false;

      if (latitude == null || longitude == null) {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          permissionDenied = true;
        } else {
          const position = await Location.getCurrentPositionAsync({});
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          locationAccuracy = position.coords.accuracy;
        }
      }

      const payload: CollectionInput = {
        material: input.material,
        weightRange: input.weightRange,
        weightKg: input.weightKg,
        collectedAt: input.collectedAt,
        createdAt: input.createdAt,
        latitude,
        longitude,
        locationAccuracy,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };

      await collectionsService.createCollection(payload);
      runBestEffortSync(collectionsSyncService.processPendingQueue());

      const dateKey = input.collectedAt.slice(0, 10);
      get().invalidateDate(dateKey);
      await Promise.all([get().loadDashboard(dateKey), get().loadHistory(50, 0)]);

      if (permissionDenied) {
        set({ collectionStatus: "permission_denied" });
        return { status: "permission_denied" };
      }

      set({ collectionStatus: "success" });
      return { status: "success" };
    } catch (error) {
      set({
        collectionStatus: "error",
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  },

  async loadHistory(limit = 20, offset = 0) {
    set({ historyStatus: "loading", errorMessage: null });

    try {
      const history = await collectionsService.getRecentCollections(limit, offset);
      set({
        history,
        historyStatus: history.length === 0 ? "empty" : "success",
      });
    } catch (error) {
      set({
        historyStatus: "error",
        errorMessage: getErrorMessage(error),
      });
    }
  },

  async deleteCollection(id) {
    set({ collectionStatus: "loading", errorMessage: null });

    try {
      const target = get().history.find((item) => item.id === id) ?? null;
      await collectionsService.deleteCollection(id);
      runBestEffortSync(collectionsSyncService.processPendingQueue());

      if (target) {
        const dateKey = target.collectedAt.slice(0, 10);
        get().invalidateDate(dateKey);
        await Promise.all([get().loadDashboard(dateKey), get().loadHistory(50, 0)]);
      } else {
        await get().loadHistory(50, 0);
      }

      set({ collectionStatus: "success" });
    } catch (error) {
      set({
        collectionStatus: "error",
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  },

  invalidateDate(date) {
    set((state) => {
      const nextSummaryByDate = { ...state.dailySummaryByDate };
      const nextWeeklySummaryByDate = { ...state.weeklySummaryByDate };
      delete nextSummaryByDate[date];
      delete nextWeeklySummaryByDate[date];

      return {
        dailySummaryByDate: nextSummaryByDate,
        weeklySummaryByDate: nextWeeklySummaryByDate,
      };
    });
  },

  clearError() {
    set({ errorMessage: null });
  },
}));
