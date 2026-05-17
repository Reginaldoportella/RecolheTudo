import type {
  PlannedRoute,
  RoutePlanningRequest,
} from "../domain/types/route";
import { calculateDistanceMeters } from "../utils/distance";
import { backendService } from "./backendService";

const OSRM_BASE_URL = "https://router.project-osrm.org";
const OSRM_PROFILE = "driving";
const MAX_DESTINATIONS = 8;

interface OsrmTableResponse {
  code: string;
  durations?: Array<Array<number | null>>;
  distances?: Array<Array<number | null>>;
}

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: string;
  }>;
}

interface CoordinateLike {
  latitude: number;
  longitude: number;
}

function buildCoordinateString(points: CoordinateLike[]): string {
  return points.map((point) => `${point.longitude},${point.latitude}`).join(";");
}

function resolveFallbackDurationSeconds(
  from: CoordinateLike,
  to: CoordinateLike,
): number {
  const distanceMeters = calculateDistanceMeters(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude,
  );

  const averageMetersPerSecond = 8.33;
  return distanceMeters / averageMetersPerSecond;
}

function getBestNextIndex(
  currentIndex: number,
  remainingIndexes: number[],
  coordinates: CoordinateLike[],
  durations: Array<Array<number | null>> | undefined,
): number {
  let bestIndex = remainingIndexes[0] ?? currentIndex;
  let bestDuration = Number.POSITIVE_INFINITY;

  for (const candidateIndex of remainingIndexes) {
    const apiDuration = durations?.[currentIndex]?.[candidateIndex] ?? null;
    const duration =
      apiDuration ??
      resolveFallbackDurationSeconds(
        coordinates[currentIndex]!,
        coordinates[candidateIndex]!,
      );

    if (duration < bestDuration) {
      bestDuration = duration;
      bestIndex = candidateIndex;
    }
  }

  return bestIndex;
}

function buildGreedyOrder(
  coordinates: CoordinateLike[],
  durations: Array<Array<number | null>> | undefined,
): number[] {
  const remaining = Array.from(
    { length: Math.max(coordinates.length - 1, 0) },
    (_, index) => index + 1,
  );
  const ordered = [0];
  let currentIndex = 0;

  while (remaining.length > 0) {
    const nextIndex = getBestNextIndex(
      currentIndex,
      remaining,
      coordinates,
      durations,
    );

    ordered.push(nextIndex);
    currentIndex = nextIndex;

    const nextRemaining = remaining.filter((index) => index !== nextIndex);
    remaining.splice(0, remaining.length, ...nextRemaining);
  }

  return ordered;
}

async function fetchOsrmTable(
  coordinates: CoordinateLike[],
): Promise<OsrmTableResponse> {
  const coordinateString = buildCoordinateString(coordinates);
  const url =
    `${OSRM_BASE_URL}/table/v1/${OSRM_PROFILE}/${coordinateString}` +
    "?annotations=duration,distance";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM table respondeu com HTTP ${response.status}`);
  }

  return (await response.json()) as OsrmTableResponse;
}

async function fetchOsrmRoute(
  coordinates: CoordinateLike[],
): Promise<OsrmRouteResponse> {
  const coordinateString = buildCoordinateString(coordinates);
  const url =
    `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${coordinateString}` +
    "?overview=full&geometries=polyline";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM route respondeu com HTTP ${response.status}`);
  }

  return (await response.json()) as OsrmRouteResponse;
}

export const routePlanningService = {
  async planRoute(request: RoutePlanningRequest): Promise<PlannedRoute> {
    if (request.destinations.length === 0) {
      return {
        provider: "none",
        orderedPoints: [],
        polyline: null,
        distanceMeters: null,
        durationSeconds: null,
      };
    }

    const limitedDestinations = request.destinations.slice(0, MAX_DESTINATIONS);
    const coordinates: CoordinateLike[] = [request.origin, ...limitedDestinations];

    try {
      const backendRoute = await backendService.planRoute({
        ...request,
        destinations: limitedDestinations,
      });

      if (backendRoute) {
        return backendRoute;
      }
    } catch {
      // Fall back to direct provider calls to preserve UX if the backend is unavailable.
    }

    try {
      const tableResponse = await fetchOsrmTable(coordinates);

      if (tableResponse.code !== "Ok") {
        throw new Error(`OSRM table retornou ${tableResponse.code}`);
      }

      const orderedIndexes = buildGreedyOrder(
        coordinates,
        tableResponse.durations,
      );
      const orderedCoordinates = orderedIndexes.map((index) => coordinates[index]!);
      const orderedPoints = orderedIndexes
        .slice(1)
        .map((index) => limitedDestinations[index - 1]!)
        .filter(Boolean);

      const routeResponse = await fetchOsrmRoute(orderedCoordinates);

      if (routeResponse.code !== "Ok") {
        throw new Error(`OSRM route retornou ${routeResponse.code}`);
      }

      const firstRoute = routeResponse.routes?.[0];

      return {
        provider: "osrm",
        orderedPoints,
        polyline: firstRoute?.geometry ?? null,
        distanceMeters: firstRoute?.distance ?? null,
        durationSeconds: firstRoute?.duration ?? null,
      };
    } catch {
      return {
        provider: "none",
        orderedPoints: limitedDestinations,
        polyline: null,
        distanceMeters: null,
        durationSeconds: null,
      };
    }
  },
};

// Future providers can be added here without changing the Routes screen:
// OSRM, Mapbox Directions API, or Google Routes API.
