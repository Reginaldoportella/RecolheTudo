import { listCollectionPoints } from "../data/in-memory-store.mjs";
import { calculateDistanceMeters } from "../utils/distance.mjs";

export function getNearbyCollectionPoints(latitude, longitude, radiusMeters = 3000) {
  return listCollectionPoints()
    .map((point) => ({
      ...point,
      distanceMeters: calculateDistanceMeters(
        latitude,
        longitude,
        point.latitude,
        point.longitude,
      ),
    }))
    .filter((point) => point.distanceMeters <= radiusMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters);
}
