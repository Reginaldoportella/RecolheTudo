import { getDatabase } from "../database";
import type {
  Collection,
  CollectionInput,
  DailySummary,
  SummaryByMaterial,
} from "../../domain/types/collection";

interface CollectionRow {
  id: number;
  material: Collection["material"];
  weight_kg: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  notes: string | null;
}

interface SummaryRow {
  material: Collection["material"];
  total_kg: number;
  collections_count: number;
}

const EMPTY_BY_MATERIAL: SummaryByMaterial = {
  papel: 0,
  plastico: 0,
  metal: 0,
  vidro: 0,
  outros: 0,
};

function mapRowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    material: row.material,
    weightKg: row.weight_kg,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

export interface CollectionsRepository {
  insertCollection(input: CollectionInput): Promise<{ id: number }>;
  getCollectionsByDate(date: string): Promise<Collection[]>;
  getRecentCollections(limit: number, offset: number): Promise<Collection[]>;
  getDailySummary(date: string): Promise<DailySummary>;
}

export const collectionsRepository: CollectionsRepository = {
  async insertCollection(input) {
    const db = await getDatabase();

    const result = await db.runAsync(
      `
        INSERT INTO collections (material, weight_kg, latitude, longitude, created_at, notes)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
      input.material,
      input.weightKg,
      input.latitude ?? null,
      input.longitude ?? null,
      input.createdAt,
      input.notes ?? null,
    );

    return { id: Number(result.lastInsertRowId) };
  },

  async getCollectionsByDate(date) {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionRow>(
      `
        SELECT id, material, weight_kg, latitude, longitude, created_at, notes
        FROM collections
        WHERE substr(created_at, 1, 10) = ?
        ORDER BY created_at DESC;
      `,
      date,
    );

    return rows.map(mapRowToCollection);
  },

  async getRecentCollections(limit, offset) {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionRow>(
      `
        SELECT id, material, weight_kg, latitude, longitude, created_at, notes
        FROM collections
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
      `,
      limit,
      offset,
    );

    return rows.map(mapRowToCollection);
  },

  async getDailySummary(date) {
    const db = await getDatabase();

    const rows = await db.getAllAsync<SummaryRow>(
      `
        SELECT material, SUM(weight_kg) AS total_kg, COUNT(*) AS collections_count
        FROM collections
        WHERE substr(created_at, 1, 10) = ?
        GROUP BY material;
      `,
      date,
    );

    const byMaterial: SummaryByMaterial = { ...EMPTY_BY_MATERIAL };
    let totalKg = 0;
    let collectionsCount = 0;

    for (const row of rows) {
      byMaterial[row.material] = Number(row.total_kg ?? 0);
      totalKg += Number(row.total_kg ?? 0);
      collectionsCount += Number(row.collections_count ?? 0);
    }

    return {
      date,
      totalKg,
      byMaterial,
      collectionsCount,
    };
  },
};
