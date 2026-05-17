import env from "../config/env.mjs";
import { insertRouteRun } from "../data/collections-repository.mjs";
import { calculateDistanceMeters } from "../utils/distance.mjs";

const OSRM_BASE_URL = "https://router.project-osrm.org";
const OSRM_PROFILE = "driving";

function buildCoordinateString(points) {
  return points.map((point) => `${point.longitude},${point.latitude}`).join(";");
}

function fallbackDurationSeconds(from, to) {
  return (
    calculateDistanceMeters(
      from.latitude,
      from.longitude,
      to.latitude,
      to.longitude,
    ) / 8.33
  );
}

function greedyOrder(coordinates, durationsMatrix) {
  const remaining = Array.from(
    { length: Math.max(coordinates.length - 1, 0) },
    (_, index) => index + 1,
  );
  const ordered = [0];
  let currentIndex = 0;

  while (remaining.length > 0) {
    let bestIndex = remaining[0];
    let bestDuration = Number.POSITIVE_INFINITY;

    for (const candidateIndex of remaining) {
      const candidateDuration =
        durationsMatrix?.[currentIndex]?.[candidateIndex] ??
        fallbackDurationSeconds(
          coordinates[currentIndex],
          coordinates[candidateIndex],
        );

      if (candidateDuration < bestDuration) {
        bestDuration = candidateDuration;
        bestIndex = candidateIndex;
      }
    }

    ordered.push(bestIndex);
    currentIndex = bestIndex;

    const nextRemaining = remaining.filter((index) => index !== bestIndex);
    remaining.splice(0, remaining.length, ...nextRemaining);
  }

  return ordered;
}

async function fetchTable(coordinates) {
  const coordinateString = buildCoordinateString(coordinates);
  const response = await fetch(
    `${OSRM_BASE_URL}/table/v1/${OSRM_PROFILE}/${coordinateString}?annotations=duration,distance`,
  );

  if (!response.ok) {
    throw new Error(`OSRM table respondeu com HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchRoute(coordinates) {
  const coordinateString = buildCoordinateString(coordinates);
  const response = await fetch(
    `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${coordinateString}?overview=full&geometries=polyline`,
  );

  if (!response.ok) {
    throw new Error(`OSRM route respondeu com HTTP ${response.status}`);
  }

  return response.json();
}

export async function planRoute(payload) {
  const origin = payload?.origin ?? null;
  const destinations = Array.isArray(payload?.destinations)
    ? payload.destinations
    : [];

  if (!origin || destinations.length === 0) {
    return {
      provider: "none",
      orderedPoints: destinations,
      polyline: null,
      distanceMeters: null,
      durationSeconds: null,
    };
  }

  const coordinates = [origin, ...destinations];

  if (!env.useOsrm) {
    return {
      provider: "none",
      orderedPoints: destinations,
      polyline: null,
      distanceMeters: null,
      durationSeconds: null,
    };
  }

  try {
    const tableResponse = await fetchTable(coordinates);
    const orderedIndexes = greedyOrder(coordinates, tableResponse.durations);
    const orderedCoordinates = orderedIndexes.map((index) => coordinates[index]);
    const orderedPoints = orderedIndexes
      .slice(1)
      .map((index) => destinations[index - 1])
      .filter(Boolean);

    const routeResponse = await fetchRoute(orderedCoordinates);
    const firstRoute = routeResponse.routes?.[0] ?? null;

    const result = {
      provider: "osrm",
      orderedPoints,
      polyline: firstRoute?.geometry ?? null,
      distanceMeters: firstRoute?.distance ?? null,
      durationSeconds: firstRoute?.duration ?? null,
    };

    await insertRouteRun({
      createdAt: new Date().toISOString(),
      provider: result.provider,
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      stopsCount: orderedPoints.length,
    });

    return result;
  } catch {
    return {
      provider: "none",
      orderedPoints: destinations,
      polyline: null,
      distanceMeters: null,
      durationSeconds: null,
    };
  }
}
