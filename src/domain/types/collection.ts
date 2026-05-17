export type Material = "papel" | "plastico" | "metal" | "vidro" | "outros";
export type WeightRange = "small" | "medium" | "large";
export type CollectionSyncStatus = "pending_sync" | "synced" | "sync_error";

export interface Collection {
  id: number;
  material: Material;
  weightRange: WeightRange;
  weightKg: number;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  collectedAt: string;
  createdAt: string;
  notes: string | null;
  remoteId: string | null;
  syncStatus: CollectionSyncStatus;
  lastSyncedAt: string | null;
}

export interface CollectionInput {
  material: Material;
  weightRange: WeightRange;
  weightKg: number;
  collectedAt: string;
  createdAt: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationAccuracy?: number | null;
}

export interface SummaryByMaterial {
  papel: number;
  plastico: number;
  metal: number;
  vidro: number;
  outros: number;
}

export interface DailySummary {
  date: string;
  totalKg: number;
  byMaterial: SummaryByMaterial;
  collectionsCount: number;
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  totalKg: number;
  collectionsCount: number;
  dailySummaries: DailySummary[];
}
