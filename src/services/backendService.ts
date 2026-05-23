import { apiConfig, buildApiUrl } from "../config/api";
import type {
  Collection,
  CollectionInput,
  DailySummary,
  MaterialsSummary,
  ProductivitySummary,
  WeeklySummary,
} from "../domain/types/collection";
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
  localId: number | string;
  remoteId: string | null;
  userId?: string | null;
  deviceId?: string | null;
  material: Collection["material"];
  weightKg: number;
  collectedAt: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  notes: string | null;
  syncMetadata?: Record<string, unknown>;
}

export interface BackendSyncRequest {
  deviceId: string;
  userId: string | null;
  lastPulledAt: string | null;
  changes: {
    collections: {
      created: BackendCollectionPayload[];
      updated: BackendCollectionPayload[];
      deleted: Array<
        Pick<
          BackendCollectionPayload,
          "localId" | "remoteId" | "userId" | "deviceId" | "updatedAt" | "deletedAt"
        >
      >;
    };
  };
}

export interface BackendSyncRejectedItem {
  code: string;
  message: string;
}

export interface BackendSyncResponse {
  requestDeviceId: string;
  syncAt: string;
  accepted: {
    collections: {
      created: BackendCollectionPayload[];
      updated: BackendCollectionPayload[];
      deleted: Array<BackendCollectionPayload & { skipped?: boolean }>;
    };
  };
  rejected: {
    collections: {
      created: BackendSyncRejectedItem[];
      updated: BackendSyncRejectedItem[];
      deleted: BackendSyncRejectedItem[];
    };
  };
  conflicts: {
    collections: unknown[];
  };
  pull: {
    collections: {
      created: BackendCollectionPayload[];
      updated: BackendCollectionPayload[];
      deleted: Array<
        Partial<BackendCollectionPayload> & {
          remoteId: string | null;
          skipped?: boolean;
        }
      >;
    };
  };
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
    updatedAt: collection.createdAt,
    deletedAt: null,
    latitude: collection.latitude ?? null,
    longitude: collection.longitude ?? null,
    locationAccuracy: collection.locationAccuracy ?? null,
    notes: collection.notes ?? null,
    syncMetadata: {},
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

  async getAnalyticsSummary(
    period: "daily" | "weekly",
    date: string,
  ): Promise<DailySummary | WeeklySummary | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(
      buildApiUrl(`/v1/analytics/summary?period=${period}&date=${date}`),
    );

    if (!response.ok) {
      throw new Error(`Backend analytics respondeu com HTTP ${response.status}`);
    }

    return (await response.json()) as DailySummary | WeeklySummary;
  },

  async getAnalyticsMaterials(
    period: "daily" | "weekly",
    date: string,
  ): Promise<MaterialsSummary | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(
      buildApiUrl(`/v1/analytics/materials?period=${period}&date=${date}`),
    );

    if (!response.ok) {
      throw new Error(
        `Backend analytics materials respondeu com HTTP ${response.status}`,
      );
    }

    return (await response.json()) as MaterialsSummary;
  },

  async getAnalyticsProductivity(
    period: "daily" | "weekly",
    date: string,
  ): Promise<ProductivitySummary | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(
      buildApiUrl(`/v1/analytics/productivity?period=${period}&date=${date}`),
    );

    if (!response.ok) {
      throw new Error(
        `Backend analytics productivity respondeu com HTTP ${response.status}`,
      );
    }

    return (await response.json()) as ProductivitySummary;
  },

  async syncEntities(payload: BackendSyncRequest): Promise<BackendSyncResponse | null> {
    if (!apiConfig.hasBackend) {
      return null;
    }

    const response = await fetch(buildApiUrl("/v1/sync"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend sync respondeu com HTTP ${response.status}`);
    }

    return (await response.json()) as BackendSyncResponse;
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
