import { routePointsRepository } from "../data/repositories/routePointsRepository";
import { collectionsService } from "./collectionsService";
import type { Collection } from "../domain/types/collection";
import type { RoutePoint, RoutePointInput } from "../domain/types/routePoint";

export interface RoutesDashboard {
  routePoints: RoutePoint[];
  recentWithCoords: Collection[];
}

export const routesService = {
  async loadDashboard(): Promise<RoutesDashboard> {
    const [routePoints, collections] = await Promise.all([
      routePointsRepository.getAllRoutePoints(),
      collectionsService.getRecentCollections(50, 0),
    ]);

    return {
      routePoints,
      recentWithCoords: collections.filter(
        (collection) =>
          collection.latitude !== null && collection.longitude !== null,
      ),
    };
  },

  async addRoutePoint(input: RoutePointInput): Promise<{ id: number }> {
    return routePointsRepository.insertRoutePoint(input);
  },
};
