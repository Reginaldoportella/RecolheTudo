import { getDatabase } from "../data/database";
import type { Collection } from "../domain/types/collection";

interface CountRow {
  count: number | null;
}

interface SchemaVersionRow {
  version: number;
  name: string;
  applied_at: string;
}

interface CollectionSnapshotRow {
  id: number;
  material: Collection["material"];
  weight_kg: number;
  estimated_weight_kg: number | null;
  collected_at: string | null;
  created_at: string;
  sync_status: Collection["syncStatus"];
  remote_id: string | null;
}

export interface DatabaseInspectionSnapshot {
  schemaVersions: SchemaVersionRow[];
  collectionsCount: number;
  collectionPointsCount: number;
  routePointsCount: number;
  pendingSyncCount: number;
  recentCollections: Array<{
    id: number;
    material: Collection["material"];
    weightKg: number;
    collectedAt: string;
    syncStatus: Collection["syncStatus"];
    remoteId: string | null;
  }>;
}

async function getCount(tableName: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CountRow>(
    `SELECT COUNT(*) AS count FROM ${tableName};`,
  );

  return Number(row?.count ?? 0);
}

export const databaseInspectionService = {
  async inspect(): Promise<DatabaseInspectionSnapshot> {
    const db = await getDatabase();

    const [schemaVersions, collectionsCount, collectionPointsCount, routePointsCount, pendingSyncCount, recentCollectionsRows] =
      await Promise.all([
        db.getAllAsync<SchemaVersionRow>(
          `
            SELECT version, name, applied_at
            FROM schema_version
            ORDER BY version ASC;
          `,
        ),
        getCount("collections"),
        getCount("collection_points"),
        getCount("route_points"),
        getCount("sync_queue"),
        db.getAllAsync<CollectionSnapshotRow>(
          `
            SELECT id, material, weight_kg, estimated_weight_kg, collected_at, created_at, sync_status, remote_id
            FROM collections
            ORDER BY COALESCE(collected_at, created_at) DESC
            LIMIT 8;
          `,
        ),
      ]);

    return {
      schemaVersions,
      collectionsCount,
      collectionPointsCount,
      routePointsCount,
      pendingSyncCount,
      recentCollections: recentCollectionsRows.map((row) => ({
        id: row.id,
        material: row.material,
        weightKg: Number(row.estimated_weight_kg ?? row.weight_kg),
        collectedAt: row.collected_at ?? row.created_at,
        syncStatus: row.sync_status,
        remoteId: row.remote_id,
      })),
    };
  },
};
