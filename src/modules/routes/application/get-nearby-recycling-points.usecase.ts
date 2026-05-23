import {
  overpassRecyclingDatasource,
  type RecyclingPointsDatasource,
} from "../data/overpass-recycling.datasource";
import type { CollectionPoint } from "../domain/collection-point.entity";

export async function getNearbyRecyclingPointsUseCase(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  datasource: RecyclingPointsDatasource = overpassRecyclingDatasource,
): Promise<CollectionPoint[]> {
  return datasource.findNearby(latitude, longitude, radiusMeters);
}
