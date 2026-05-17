import { apiConfig, buildApiUrl } from "../config/api";
import type { Collection, CollectionInput } from "../domain/types/collection";
import type { CollectionPoint } from "../domain/types/collectionPoint";
import type { PlannedRoute, RoutePlanningRequest } from "../domain/types/route";

export interface BackendHealthSnapshot {
  status: string;
  service: string;
  time: string;
  state?: {
    collectionsCount: number;
    collectionPointsCount: number;
    routeRunsCount: number;
  };
}

export interface BackendCollectionPayload {
  localId: number;
  remoteId: string;
  material: Collection["material"];
  weightKg: number;
  collectedAt: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  notes: string | null;
}

export interface BackendSyncCollectionsResponse {
  acceptedCollections: BackendCollectionPayload[];
  syncCursor: string;
  receivedCount: number;
}

function toRemoteCollectionId(localId: number): string {
  return `local-${localId}`;
}

export function buildBackendCollectionPayload(
  localId: number,
  collection: CollectionInput,
): BackendCollectionPayload {
  return {
    localId,
    remoteId: toRemoteCollectionId(localId),
    material: collection.material,
    weightKg: collection.weightKg,
    collectedAt: collection.collectedAt,
    createdAt: collection.createdAt,
    latitude: collection.latitude ?? null,
    longitude: collection.longitude ?? null,
    locationAccuracy: collection.locationAccuracy ?? null,
    notes: collection.notes ?? null,
  };
}

export const backendService = {
  async getHealth(): Promise<BackendHealthSnapshot | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(buildApiUrl("/health"));

    if (!response.ok) {
      throw new Error(`Backend health respondeu com HTTP ${response.status}`);
    }

    return (await response.json()) as BackendHealthSnapshot;
  },

  async getNearbyCollectionPoints(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<CollectionPoint[] | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const url = buildApiUrl(
      `/v1/collection-points/nearby?latitude=${latitude}&longitude=${longitude}&radiusMeters=${radiusMeters}`,
    );
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Backend collection-points respondeu com HTTP ${response.status}`,
      );
    }

    const payload = (await response.json()) as { points: CollectionPoint[] };
    return payload.points;
  },

  async syncCollections(
    collections: BackendCollectionPayload[],
  ): Promise<BackendSyncCollectionsResponse | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(buildApiUrl("/v1/collections/sync"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ collections }),
    });

    if (!response.ok) {
      throw new Error(`Backend collections respondeu com HTTP ${response.status}`);
    }

    return (await response.json()) as BackendSyncCollectionsResponse;
  },

  async deleteCollection(localId: number): Promise<boolean | null> {
    return backendService.deleteCollectionByRemoteId(toRemoteCollectionId(localId));
  },

  async deleteCollectionByRemoteId(remoteId: string): Promise<boolean | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(buildApiUrl(`/v1/collections/${remoteId}`), {
      method: "DELETE",
    });

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      throw new Error(`Backend delete respondeu com HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { deleted: boolean };
    return payload.deleted;
  },

  async planRoute(
    request: RoutePlanningRequest,
  ): Promise<PlannedRoute | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(buildApiUrl("/v1/routes/plan"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Backend routes respondeu com HTTP ${response.status}`);
    }

    return (await response.json()) as PlannedRoute;
  },
};
