import { create } from "zustand";
import * as Location from "expo-location";
import type {
  Collection,
  CollectionInput,
  DailySummary,
} from "../domain/types/collection";
import { collectionsRepository } from "../data/repositories/collectionsRepository";
import { validateCollection } from "../validation/collectionValidation";

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
  history: Collection[];
  homeStatus: UIStatus;
  collectionStatus: UIStatus;
  historyStatus: UIStatus;
  errorMessage: string | null;
  loadHome: (date: string) => Promise<void>;
  registerCollection: (input: CollectionInput) => Promise<RegisterResult>;
  loadHistory: (limit?: number, offset?: number) => Promise<void>;
  invalidateDate: (date: string) => void;
  clearError: () => void;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro inesperado ao processar operacao";
}

export const useCollectionsStore = create<CollectionsStoreState>((set, get) => ({
  dailySummaryByDate: {},
  history: [],
  homeStatus: "idle",
  collectionStatus: "idle",
  historyStatus: "idle",
  errorMessage: null,

  async loadHome(date) {
    const cachedSummary = get().dailySummaryByDate[date];

    if (cachedSummary) {
      set({
        homeStatus: cachedSummary.collectionsCount === 0 ? "empty" : "success",
      });
      return;
    }

    set({ homeStatus: "loading", errorMessage: null });

    try {
      const summary = await collectionsRepository.getDailySummary(date);

      set((state) => ({
        dailySummaryByDate: {
          ...state.dailySummaryByDate,
          [date]: summary,
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
      validateCollection(input);

      let latitude = input.latitude ?? null;
      let longitude = input.longitude ?? null;
      let permissionDenied = false;

      if (latitude == null || longitude == null) {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
          permissionDenied = true;
        } else {
          const position = await Location.getCurrentPositionAsync({});
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        }
      }

      const payload: CollectionInput = {
        material: input.material,
        weightKg: input.weightKg,
        createdAt: input.createdAt,
        latitude,
        longitude,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };

      await collectionsRepository.insertCollection(payload);

      const dateKey = input.createdAt.slice(0, 10);
      get().invalidateDate(dateKey);
      await get().loadHome(dateKey);

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
      const history = await collectionsRepository.getRecentCollections(limit, offset);
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

  invalidateDate(date) {
    set((state) => {
      const nextSummaryByDate = { ...state.dailySummaryByDate };
      delete nextSummaryByDate[date];

      return { dailySummaryByDate: nextSummaryByDate };
    });
  },

  clearError() {
    set({ errorMessage: null });
  },
}));
