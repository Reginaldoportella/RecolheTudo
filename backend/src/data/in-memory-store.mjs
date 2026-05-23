import { seedCollectionPoints } from "./seeds.mjs";

let collectionSequence = 1;

const state = {
  collections: [],
  collectionPoints: [...seedCollectionPoints],
  routeRuns: [],
};

export function listCollections() {
  return [...state.collections].sort(
    (left, right) =>
      new Date(right.collectedAt).getTime() - new Date(left.collectedAt).getTime(),
  );
}

export function upsertCollections(incomingCollections) {
  const accepted = [];

  for (const item of incomingCollections) {
    const remoteId = item.remoteId ?? `col_${collectionSequence++}`;
    const nextItem = {
      remoteId,
      localId: item.localId ?? null,
      material: item.material,
      weightKg: item.weightKg,
      collectedAt: item.collectedAt,
      createdAt: item.createdAt ?? item.collectedAt,
      latitude: item.latitude ?? null,
      longitude: item.longitude ?? null,
      locationAccuracy: item.locationAccuracy ?? null,
      notes: item.notes ?? null,
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    const existingIndex = state.collections.findIndex(
      (collection) => collection.remoteId === remoteId,
    );

    if (existingIndex >= 0) {
      state.collections.splice(existingIndex, 1, nextItem);
    } else {
      state.collections.push(nextItem);
    }

    accepted.push(nextItem);
  }

  return accepted;
}

export function deleteCollection(remoteId) {
  const index = state.collections.findIndex(
    (collection) => collection.remoteId === remoteId,
  );

  if (index === -1) {
    return false;
  }

  state.collections.splice(index, 1);
  return true;
}

export function listCollectionPoints() {
  return [...state.collectionPoints];
}

export function saveRouteRun(routeRun) {
  state.routeRuns.push(routeRun);
  return routeRun;
}

export function inspectState() {
  return {
    collectionsCount: state.collections.length,
    collectionPointsCount: state.collectionPoints.length,
    routeRunsCount: state.routeRuns.length,
  };
}
