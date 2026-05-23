import type {
  CollectionPoint,
  CollectionPointInput,
} from "../domain/types/collectionPoint";
import { collectionPointsRepository } from "../data/repositories/collectionPointsRepository";
import { createManualCollectionPointUseCase } from "../modules/routes/application/create-manual-collection-point.usecase";
import { listSavedCollectionPointsUseCase } from "../modules/routes/application/list-saved-collection-points.usecase";
import {
  syncNearbyRecyclingPointsUseCase,
  type SyncNearbyRecyclingPointsResult,
} from "../modules/routes/application/sync-nearby-recycling-points.usecase";
import { backendService } from "./backendService";

export const collectionPointsService = {
  async syncNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<SyncNearbyRecyclingPointsResult> {
    try {
      const backendPoints = await backendService.getNearbyCollectionPoints(
        latitude,
        longitude,
        radiusMeters,
      );

      if (backendPoints) {
        await collectionPointsRepository.upsertMany(backendPoints);

        return {
          points: backendPoints,
          fromCache: false,
        };
      }
    } catch {
      // Keep offline-first behavior and reuse the existing local/Overpass flow.
    }

    return syncNearbyRecyclingPointsUseCase(latitude, longitude, radiusMeters);
  },

  async listSaved(): Promise<CollectionPoint[]> {
    return listSavedCollectionPointsUseCase();
  },

  async createManual(input: CollectionPointInput): Promise<void> {
    await createManualCollectionPointUseCase(input);
  },
};
