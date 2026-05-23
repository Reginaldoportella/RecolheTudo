import { listCollectionPoints } from "../data/in-memory-store.mjs";
import { calculateDistanceMeters } from "../utils/distance.mjs";

const materialAliases = {
  papel: "paper",
  paper: "paper",
  plastico: "plastic",
  plastic: "plastic",
  metal: "metal",
  vidro: "glass",
  glass: "glass",
  outros: "other",
  other: "other",
};

function normalizeMaterialFilter(material) {
  if (!material) {
    return null;
  }

  return materialAliases[String(material).toLowerCase()] ?? null;
}

export function getNearbyCollectionPoints(
  latitude,
  longitude,
  radiusMeters = 3000,
  material = null,
  limit = 20,
) {
  const normalizedMaterial = normalizeMaterialFilter(material);

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
    .filter((point) => {
      if (!normalizedMaterial) {
        return true;
      }

      return point.materialType.toLowerCase().includes(normalizedMaterial);
    })
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, limit);
}
