import {
  collectionPointsRepository,
  type CollectionPointsRepository,
} from "../data/collection-points.repository";
import {
  overpassRecyclingDatasource,
  type RecyclingPointsDatasource,
} from "../data/overpass-recycling.datasource";
import type { CollectionPoint } from "../domain/collection-point.entity";

export interface SyncNearbyRecyclingPointsResult {
  points: CollectionPoint[];
  fromCache: boolean;
}

export async function syncNearbyRecyclingPointsUseCase(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  datasource: RecyclingPointsDatasource = overpassRecyclingDatasource,
  repository: CollectionPointsRepository = collectionPointsRepository,
): Promise<SyncNearbyRecyclingPointsResult> {
  try {
    const remotePoints = await datasource.findNearby(
      latitude,
      longitude,
      radiusMeters,
    );
    await repository.upsertMany(remotePoints);

    return {
      points: remotePoints,
      fromCache: false,
    };
  } catch {
    const cachedPoints = await repository.findNearby(
      latitude,
      longitude,
      radiusMeters,
    );

    return {
      points: cachedPoints,
      fromCache: true,
    };
  }
}
