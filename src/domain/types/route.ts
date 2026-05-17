import type { CollectionPoint } from "./collectionPoint";

export interface RoutePlanningRequest {
  origin: {
    latitude: number;
    longitude: number;
  };
  destinations: CollectionPoint[];
}

export interface PlannedRoute {
  provider: "none" | "osrm" | "mapbox" | "google";
  orderedPoints: CollectionPoint[];
  polyline: string | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
}
