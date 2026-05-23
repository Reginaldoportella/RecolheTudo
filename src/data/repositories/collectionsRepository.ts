import { getDatabase } from "../database";
import type {
  Collection,
  CollectionInput,
  CollectionSyncStatus,
  DailySummary,
  SummaryByMaterial,
  WeeklySummary,
} from "../../domain/types/collection";
import type { BackendCollectionPayload } from "../../services/backendService";

interface CollectionRow {
  id: number;
  material: Collection["material"];
  weight_range: Collection["weightRange"];
  weight_kg: number;
  estimated_weight_kg: number | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  collected_at: string | null;
  created_at: string;
  notes: string | null;
  remote_id: string | null;
  sync_status: CollectionSyncStatus;
  last_synced_at: string | null;
}

interface SummaryRow {
  material: Collection["material"];
  total_kg: number;
  collections_count: number;
}

interface SyncQueueRow {
  id: number;
  entity_id: number | null;
  operation: "upsert" | "delete";
  payload: string;
  attempts: number;
  last_error: string | null;
  last_attempt_at: string | null;
  created_at: string;
}

const EMPTY_BY_MATERIAL: SummaryByMaterial = {
  papel: 0,
  plastico: 0,
  metal: 0,
  vidro: 0,
  outros: 0,
};

function mapRowToCollection(row: CollectionRow): Collection {
  const collectedAt = row.collected_at ?? row.created_at;
  const weightKg = row.estimated_weight_kg ?? row.weight_kg;

  return {
    id: row.id,
    material: row.material,
    weightRange: row.weight_range,
    weightKg,
    latitude: row.latitude,
    longitude: row.longitude,
    locationAccuracy: row.location_accuracy,
    collectedAt,
    createdAt: row.created_at,
    notes: row.notes,
    remoteId: row.remote_id,
    syncStatus: row.sync_status,
    lastSyncedAt: row.last_synced_at,
  };
}

export interface CollectionSyncQueueEntry {
  id: number;
  entityId: number | null;
  operation: "upsert" | "delete";
  payload: string;
  attempts: number;
  lastError: string | null;
  lastAttemptAt: string | null;
  createdAt: string;
}

export interface CollectionsRepository {
  insertCollection(input: CollectionInput): Promise<{ id: number }>;
  getAllCollections(): Promise<Collection[]>;
  getCollectionById(id: number): Promise<Collection | null>;
  getCollectionsByDate(date: string): Promise<Collection[]>;
  getCollectionsByDateRange(startDate: string, endDate: string): Promise<Collection[]>;
  getRecentCollections(limit: number, offset: number): Promise<Collection[]>;
  getDailySummary(date: string): Promise<DailySummary>;
  getWeeklySummary(referenceDate: string): Promise<WeeklySummary>;
  deleteById(id: number): Promise<void>;
  enqueueDeleteSync(remoteId: string, entityId?: number | null): Promise<void>;
  deleteQueuedUpsertsByCollectionId(id: number): Promise<void>;
  getPendingSyncQueue(limit: number): Promise<CollectionSyncQueueEntry[]>;
  getLastSyncedAt(): Promise<string | null>;
  markCollectionAsSynced(id: number, remoteId: string, syncedAt: string): Promise<void>;
  markCollectionSyncError(id: number): Promise<void>;
  markSyncQueueFailure(queueId: number, message: string): Promise<void>;
  deleteSyncQueueEntry(queueId: number): Promise<void>;
  getPendingSyncCount(): Promise<number>;
  upsertCollectionFromRemote(payload: BackendCollectionPayload, syncedAt: string): Promise<void>;
  deleteByRemoteId(remoteId: string): Promise<void>;
}

export const collectionsRepository: CollectionsRepository = {
  async insertCollection(input) {
    const db = await getDatabase();
    await db.execAsync("BEGIN TRANSACTION;");

    try {
      const result = await db.runAsync(
        `
          INSERT INTO collections (
            material,
            weight_range,
            weight_kg,
            estimated_weight_kg,
            latitude,
            longitude,
            location_accuracy,
            collected_at,
            created_at,
            notes,
            remote_id,
            sync_status,
            last_synced_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        input.material,
        input.weightRange,
        input.weightKg,
        input.weightKg,
        input.latitude ?? null,
        input.longitude ?? null,
        input.locationAccuracy ?? null,
        input.collectedAt,
        input.createdAt,
        input.notes ?? null,
        null,
        "pending_sync",
        null,
      );

      const id = Number(result.lastInsertRowId);
      const syncPayload: BackendCollectionPayload = {
        localId: id,
        remoteId: `local-${id}`,
        material: input.material,
        weightKg: input.weightKg,
        collectedAt: input.collectedAt,
        createdAt: input.createdAt,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        locationAccuracy: input.locationAccuracy ?? null,
        notes: input.notes ?? null,
      };

      await db.runAsync(
        `
          INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
          VALUES (?, ?, ?, ?, ?);
        `,
        "collection",
        id,
        "upsert",
        JSON.stringify(syncPayload),
        new Date().toISOString(),
      );

      await db.execAsync("COMMIT;");
      return { id };
    } catch (error) {
      await db.execAsync("ROLLBACK;");
      throw error;
    }
  },

  async getAllCollections() {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionRow>(
      `
        SELECT id, material, weight_range, weight_kg, estimated_weight_kg,
               latitude, longitude, location_accuracy, collected_at, created_at, notes,
               remote_id, sync_status, last_synced_at
        FROM collections
        ORDER BY collected_at DESC, created_at DESC;
      `,
    );

    return rows.map(mapRowToCollection);
  },

  async getCollectionById(id) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<CollectionRow>(
      `
        SELECT id, material, weight_range, weight_kg, estimated_weight_kg,
               latitude, longitude, location_accuracy, collected_at, created_at, notes,
               remote_id, sync_status, last_synced_at
        FROM collections
        WHERE id = ?;
      `,
      id,
    );

    return row ? mapRowToCollection(row) : null;
  },

  async getCollectionsByDate(date) {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionRow>(
      `
        SELECT id, material, weight_range, weight_kg, estimated_weight_kg,
               latitude, longitude, location_accuracy, collected_at, created_at, notes,
               remote_id, sync_status, last_synced_at
        FROM collections
        WHERE substr(COALESCE(collected_at, created_at), 1, 10) = ?
        ORDER BY COALESCE(collected_at, created_at) DESC;
      `,
      date,
    );

    return rows.map(mapRowToCollection);
  },

  async getCollectionsByDateRange(startDate, endDate) {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionRow>(
      `
        SELECT id, material, weight_range, weight_kg, estimated_weight_kg,
               latitude, longitude, location_accuracy, collected_at, created_at, notes,
               remote_id, sync_status, last_synced_at
        FROM collections
        WHERE substr(COALESCE(collected_at, created_at), 1, 10) BETWEEN ? AND ?
        ORDER BY COALESCE(collected_at, created_at) DESC;
      `,
      startDate,
      endDate,
    );

    return rows.map(mapRowToCollection);
  },

  async getRecentCollections(limit, offset) {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionRow>(
      `
        SELECT id, material, weight_range, weight_kg, estimated_weight_kg,
               latitude, longitude, location_accuracy, collected_at, created_at, notes,
               remote_id, sync_status, last_synced_at
        FROM collections
        ORDER BY COALESCE(collected_at, created_at) DESC
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
        SELECT material, SUM(COALESCE(estimated_weight_kg, weight_kg)) AS total_kg, COUNT(*) AS collections_count
        FROM collections
        WHERE substr(COALESCE(collected_at, created_at), 1, 10) = ?
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

  async getWeeklySummary(referenceDate) {
    const end = new Date(`${referenceDate}T00:00:00.000Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setUTCDate(start.getUTCDate() + i);
      dates.push(day.toISOString().slice(0, 10));
    }

    const dailySummaries = await Promise.all(
      dates.map((date) => collectionsRepository.getDailySummary(date)),
    );

    const startDate = dates[0] ?? referenceDate;
    const endDate = dates[dates.length - 1] ?? referenceDate;

    return {
      startDate,
      endDate,
      totalKg: dailySummaries.reduce((total, summary) => total + summary.totalKg, 0),
      collectionsCount: dailySummaries.reduce(
        (total, summary) => total + summary.collectionsCount,
        0,
      ),
      dailySummaries,
    };
  },

  async deleteById(id) {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM collections WHERE id = ?;", id);
  },

  async enqueueDeleteSync(remoteId, entityId = null) {
    const db = await getDatabase();
    await db.runAsync(
      `
        INSERT INTO sync_queue (entity_type, entity_id, operation, payload, created_at)
        VALUES (?, ?, ?, ?, ?);
      `,
      "collection",
      entityId,
      "delete",
      JSON.stringify({ remoteId }),
      new Date().toISOString(),
    );
  },

  async deleteQueuedUpsertsByCollectionId(id) {
    const db = await getDatabase();
    await db.runAsync(
      "DELETE FROM sync_queue WHERE entity_type = ? AND entity_id = ? AND operation = ?;",
      "collection",
      id,
      "upsert",
    );
  },

  async getPendingSyncQueue(limit) {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SyncQueueRow>(
      `
        SELECT id, entity_id, operation, payload, attempts, last_error, last_attempt_at, created_at
        FROM sync_queue
        ORDER BY created_at ASC
        LIMIT ?;
      `,
      limit,
    );

    return rows.map((row) => ({
      id: row.id,
      entityId: row.entity_id,
      operation: row.operation,
      payload: row.payload,
      attempts: row.attempts,
      lastError: row.last_error,
      lastAttemptAt: row.last_attempt_at,
      createdAt: row.created_at,
    }));
  },

  async getLastSyncedAt() {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ last_synced_at: string | null }>(
      `
        SELECT MAX(last_synced_at) AS last_synced_at
        FROM collections;
      `,
    );

    return row?.last_synced_at ?? null;
  },

  async markCollectionAsSynced(id, remoteId, syncedAt) {
    const db = await getDatabase();
    await db.runAsync(
      `
        UPDATE collections
        SET remote_id = ?, sync_status = ?, last_synced_at = ?
        WHERE id = ?;
      `,
      remoteId,
      "synced",
      syncedAt,
      id,
    );
  },

  async markCollectionSyncError(id) {
    const db = await getDatabase();
    await db.runAsync(
      "UPDATE collections SET sync_status = ? WHERE id = ?;",
      "sync_error",
      id,
    );
  },

  async markSyncQueueFailure(queueId, message) {
    const db = await getDatabase();
    await db.runAsync(
      `
        UPDATE sync_queue
        SET attempts = attempts + 1, last_error = ?, last_attempt_at = ?
        WHERE id = ?;
      `,
      message,
      new Date().toISOString(),
      queueId,
    );
  },

  async deleteSyncQueueEntry(queueId) {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM sync_queue WHERE id = ?;", queueId);
  },

  async getPendingSyncCount() {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number | null }>(
      "SELECT COUNT(*) AS count FROM sync_queue;",
    );

    return Number(row?.count ?? 0);
  },

  async upsertCollectionFromRemote(payload, syncedAt) {
    const db = await getDatabase();
    const remoteId = payload.remoteId;

    if (!remoteId) {
      return;
    }

    const existing = await db.getFirstAsync<{ id: number | null }>(
      "SELECT id FROM collections WHERE remote_id = ?;",
      remoteId,
    );

    if (existing?.id != null) {
      await db.runAsync(
        `
          UPDATE collections
          SET material = ?, weight_range = COALESCE(weight_range, 'medium'),
              weight_kg = ?, estimated_weight_kg = ?,
              latitude = ?, longitude = ?, location_accuracy = ?,
              collected_at = ?, created_at = ?, notes = ?,
              sync_status = ?, last_synced_at = ?
          WHERE id = ?;
        `,
        payload.material,
        payload.weightKg,
        payload.weightKg,
        payload.latitude ?? null,
        payload.longitude ?? null,
        payload.locationAccuracy ?? null,
        payload.collectedAt,
        payload.createdAt,
        payload.notes ?? null,
        "synced",
        syncedAt,
        existing.id,
      );
      return;
    }

    await db.runAsync(
      `
        INSERT INTO collections (
          material,
          weight_range,
          weight_kg,
          estimated_weight_kg,
          latitude,
          longitude,
          location_accuracy,
          collected_at,
          created_at,
          notes,
          remote_id,
          sync_status,
          last_synced_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      payload.material,
      "medium",
      payload.weightKg,
      payload.weightKg,
      payload.latitude ?? null,
      payload.longitude ?? null,
      payload.locationAccuracy ?? null,
      payload.collectedAt,
      payload.createdAt,
      payload.notes ?? null,
      remoteId,
      "synced",
      syncedAt,
    );
  },

  async deleteByRemoteId(remoteId) {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM collections WHERE remote_id = ?;", remoteId);
  },
};
