export type Material = "papel" | "plastico" | "metal" | "vidro" | "outros";

export interface Collection {
  id: number;
  material: Material;
  weightKg: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  notes: string | null;
}

export interface CollectionInput {
  material: Material;
  weightKg: number;
  createdAt: string;
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
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
