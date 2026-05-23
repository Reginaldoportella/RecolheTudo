import * as Location from "expo-location";
import { create } from "zustand";

import type { CollectionPoint } from "../domain/types/collectionPoint";
import type { PlannedRoute } from "../domain/types/route";
import { collectionPointsService } from "../services/collectionPointsService";
import { routePlanningService } from "../services/routePlanningService";

export interface CurrentLocation {
  latitude: number;
  longitude: number;
}

interface RoutesStoreState {
  currentLocation: CurrentLocation | null;
  points: CollectionPoint[];
  selectedPoint: CollectionPoint | null;
  plannedRoute: PlannedRoute | null;
  isLoading: boolean;
  error: string | null;
  locationPermissionDenied: boolean;
  lastLoadUsedCache: boolean;
  loadCurrentLocation: () => Promise<CurrentLocation | null>;
  loadNearbyPoints: () => Promise<void>;
  selectPoint: (point: CollectionPoint | null) => void;
  refreshPoints: () => Promise<void>;
}

const DEFAULT_RADIUS_METERS = 3000;

export const useRoutesStore = create<RoutesStoreState>((set, get) => ({
  currentLocation: null,
  points: [],
  selectedPoint: null,
  plannedRoute: null,
  isLoading: false,
  error: null,
  locationPermissionDenied: false,
  lastLoadUsedCache: false,

  async loadCurrentLocation() {
    set({ isLoading: true, error: null });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        set({
          currentLocation: null,
          locationPermissionDenied: true,
          error: "Permissao de localizacao negada. Exibindo pontos salvos.",
        });
        return null;
      }

      const position = await Location.getCurrentPositionAsync({});
      const currentLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      set({
        currentLocation,
        locationPermissionDenied: false,
        error: null,
      });

      return currentLocation;
    } catch {
      set({
        currentLocation: null,
        error: "Nao foi possivel obter sua localizacao agora.",
      });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  async loadNearbyPoints() {
    set({ isLoading: true, error: null });

    try {
      const location = get().currentLocation;

      if (!location) {
        const savedPoints = await collectionPointsService.listSaved();
        set({
          points: savedPoints,
          selectedPoint: null,
          plannedRoute: null,
          lastLoadUsedCache: true,
        });
        return;
      }

      const result = await collectionPointsService.syncNearby(
        location.latitude,
        location.longitude,
        DEFAULT_RADIUS_METERS,
      );

      set({
        points: result.points,
        selectedPoint: null,
        plannedRoute: null,
        lastLoadUsedCache: result.fromCache,
        error:
          result.fromCache && result.points.length === 0
            ? "Nao foi possivel buscar pontos proximos. Nenhum ponto salvo encontrado."
            : null,
      });
    } catch {
      set({
        error: "Nao foi possivel carregar os pontos de reciclagem.",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  selectPoint(point) {
    set({ selectedPoint: point });
  },

  async refreshPoints() {
    const location = await get().loadCurrentLocation();

    if (!location) {
      const savedPoints = await collectionPointsService.listSaved();
      set({
        points: savedPoints,
        selectedPoint: null,
        plannedRoute: null,
        lastLoadUsedCache: true,
      });
      return;
    }

    await get().loadNearbyPoints();

    const nextPoints = get().points;

    if (nextPoints.length === 0) {
      set({ plannedRoute: null });
      return;
    }

    const plannedRoute = await routePlanningService.planRoute({
      origin: location,
      destinations: nextPoints,
    });

    set({
      plannedRoute,
      points:
        plannedRoute.orderedPoints.length > 0
          ? plannedRoute.orderedPoints
          : nextPoints,
      selectedPoint: plannedRoute.orderedPoints[0] ?? nextPoints[0] ?? null,
      error:
        plannedRoute.provider === "none"
          ? get().error ?? "Nao foi possivel calcular a rota otimizada agora."
          : get().error,
    });
  },
}));
