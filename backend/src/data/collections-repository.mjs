import { query } from "./postgres.mjs";

function toIsoString(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapRow(row) {
  return {
    remoteId: row.remote_id,
    localId: row.local_id,
    userId: row.user_id,
    deviceId: row.device_id,
    material: row.material,
    weightKg: Number(row.weight_kg),
    collectedAt: toIsoString(row.collected_at),
    createdAt: toIsoString(row.created_at),
    latitude: row.latitude,
    longitude: row.longitude,
    locationAccuracy: row.location_accuracy,
    notes: row.notes,
    updatedAt: toIsoString(row.updated_at),
    deletedAt: toIsoString(row.deleted_at),
    syncedAt: toIsoString(row.synced_at),
    serverUpdatedAt: toIsoString(row.server_updated_at),
    syncVersion: Number(row.sync_version ?? 1),
    syncMetadata: row.sync_metadata ?? {},
  };
}

export async function upsertCollections(incomingCollections) {
  const accepted = [];

  for (const item of incomingCollections) {
    const remoteId = item.remoteId ?? `srv-${crypto.randomUUID()}`;
    const result = await query(
      `
        INSERT INTO collections (
          remote_id,
          local_id,
          user_id,
          device_id,
          material,
          weight_kg,
          collected_at,
          created_at,
          latitude,
          longitude,
          location_accuracy,
          notes,
          updated_at,
          deleted_at,
          synced_at,
          sync_version,
          server_updated_at,
          sync_metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), 1, NOW(), $15::jsonb)
        ON CONFLICT (remote_id)
        DO UPDATE SET
          local_id = EXCLUDED.local_id,
          user_id = COALESCE(EXCLUDED.user_id, collections.user_id),
          device_id = COALESCE(EXCLUDED.device_id, collections.device_id),
          material = EXCLUDED.material,
          weight_kg = EXCLUDED.weight_kg,
          collected_at = EXCLUDED.collected_at,
          created_at = EXCLUDED.created_at,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          location_accuracy = EXCLUDED.location_accuracy,
          notes = EXCLUDED.notes,
          updated_at = EXCLUDED.updated_at,
          deleted_at = EXCLUDED.deleted_at,
          synced_at = NOW(),
          sync_version = collections.sync_version + 1,
          server_updated_at = NOW(),
          sync_metadata = EXCLUDED.sync_metadata
        RETURNING
          remote_id,
          local_id,
          user_id,
          device_id,
          material,
          weight_kg,
          collected_at,
          created_at,
          latitude,
          longitude,
          location_accuracy,
          notes,
          updated_at,
          deleted_at,
          synced_at,
          sync_version,
          server_updated_at,
          sync_metadata;
      `,
      [
        remoteId,
        item.localId != null ? String(item.localId) : null,
        item.userId ?? null,
        item.deviceId ?? null,
        item.material,
        item.weightKg,
        item.collectedAt,
        item.createdAt ?? item.collectedAt,
        item.latitude ?? null,
        item.longitude ?? null,
        item.locationAccuracy ?? null,
        item.notes ?? null,
        item.updatedAt ?? item.createdAt ?? item.collectedAt,
        item.deletedAt ?? null,
        JSON.stringify(item.syncMetadata ?? {}),
      ],
    );

    accepted.push(mapRow(result.rows[0]));
  }

  return accepted;
}

export async function listCollections(limit = 50) {
  const result = await query(
    `
      SELECT
        remote_id,
        local_id,
        user_id,
        device_id,
        material,
        weight_kg,
        collected_at,
        created_at,
        latitude,
        longitude,
        location_accuracy,
        notes,
        updated_at,
        deleted_at,
        synced_at,
        sync_version,
        server_updated_at,
        sync_metadata
      FROM collections
      WHERE deleted_at IS NULL
      ORDER BY collected_at DESC, created_at DESC
      LIMIT $1;
    `,
    [limit],
  );

  return result.rows.map(mapRow);
}

export async function deleteCollection(remoteId) {
  const result = await query(
    `
      UPDATE collections
      SET
        deleted_at = COALESCE(deleted_at, NOW()),
        updated_at = NOW(),
        synced_at = NOW(),
        sync_version = sync_version + 1,
        server_updated_at = NOW()
      WHERE remote_id = $1
      RETURNING remote_id;
    `,
    [remoteId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function softDeleteCollections(incomingCollections) {
  const accepted = [];

  for (const item of incomingCollections) {
    const referenceId = item.remoteId ?? null;

    if (!referenceId) {
      accepted.push({
        remoteId: null,
        localId: item.localId ?? null,
        deletedAt: item.deletedAt ?? new Date().toISOString(),
        skipped: true,
      });
      continue;
    }

    const result = await query(
      `
        UPDATE collections
        SET
          deleted_at = COALESCE($2, NOW()),
          updated_at = COALESCE($3, NOW()),
          synced_at = NOW(),
          sync_version = sync_version + 1,
          server_updated_at = NOW()
        WHERE remote_id = $1
        RETURNING
          remote_id,
          local_id,
          user_id,
          device_id,
          material,
          weight_kg,
          collected_at,
          created_at,
          latitude,
          longitude,
          location_accuracy,
          notes,
          updated_at,
          deleted_at,
          synced_at,
          sync_version,
          server_updated_at,
          sync_metadata;
      `,
      [referenceId, item.deletedAt ?? null, item.updatedAt ?? null],
    );

    accepted.push(
      result.rows[0]
        ? mapRow(result.rows[0])
        : {
          remoteId: referenceId,
          localId: item.localId ?? null,
          deletedAt: item.deletedAt ?? new Date().toISOString(),
          skipped: true,
        },
    );
  }

  return accepted;
}

export async function listCollectionChangesSince(lastPulledAt, limit = 500) {
  const cursor = lastPulledAt ?? "1970-01-01T00:00:00.000Z";
  const result = await query(
    `
      SELECT
        remote_id,
        local_id,
        user_id,
        device_id,
        material,
        weight_kg,
        collected_at,
        created_at,
        latitude,
        longitude,
        location_accuracy,
        notes,
        updated_at,
        deleted_at,
        synced_at,
        sync_version,
        server_updated_at,
        sync_metadata
      FROM collections
      WHERE server_updated_at > $1::timestamptz
      ORDER BY server_updated_at ASC
      LIMIT $2;
    `,
    [cursor, limit],
  );

  const created = [];
  const updated = [];
  const deleted = [];

  for (const row of result.rows) {
    const mapped = mapRow(row);
    const createdAtMs = Date.parse(mapped.createdAt);
    const cursorMs = Date.parse(cursor);

    if (mapped.deletedAt) {
      deleted.push(mapped);
    } else if (createdAtMs > cursorMs) {
      created.push(mapped);
    } else {
      updated.push(mapped);
    }
  }

  return { created, updated, deleted };
}

function emptyByMaterial() {
  return {
    papel: 0,
    plastico: 0,
    metal: 0,
    vidro: 0,
    outros: 0,
  };
}

function getDateRange(referenceDate, period) {
  const end = new Date(`${referenceDate}T00:00:00.000Z`);
  const start = new Date(end);

  if (period === "weekly") {
    start.setUTCDate(start.getUTCDate() - 6);
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export async function getDailySummary(date) {
  const result = await query(
    `
      SELECT material, SUM(weight_kg) AS total_kg, COUNT(*)::int AS collections_count
      FROM collections
      WHERE deleted_at IS NULL
        AND collected_at::date = $1::date
      GROUP BY material;
    `,
    [date],
  );

  const byMaterial = emptyByMaterial();
  let totalKg = 0;
  let collectionsCount = 0;

  for (const row of result.rows) {
    const totalByMaterial = Number(row.total_kg ?? 0);
    byMaterial[row.material] = totalByMaterial;
    totalKg += totalByMaterial;
    collectionsCount += Number(row.collections_count ?? 0);
  }

  return {
    date,
    totalKg,
    byMaterial,
    collectionsCount,
  };
}

export async function getMaterialsSummary(referenceDate, period = "daily") {
  const { startDate, endDate } = getDateRange(referenceDate, period);
  const result = await query(
    `
      SELECT material, SUM(weight_kg) AS total_kg, COUNT(*)::int AS collections_count
      FROM collections
      WHERE deleted_at IS NULL
        AND collected_at::date BETWEEN $1::date AND $2::date
      GROUP BY material
      ORDER BY total_kg DESC, collections_count DESC;
    `,
    [startDate, endDate],
  );

  const items = result.rows.map((row) => ({
    material: row.material,
    totalKg: Number(row.total_kg ?? 0),
    collectionsCount: Number(row.collections_count ?? 0),
  }));

  return {
    period,
    startDate,
    endDate,
    items,
  };
}

export async function getProductivitySummary(referenceDate, period = "daily") {
  if (period === "daily") {
    const summary = await getDailySummary(referenceDate);
    return {
      period,
      startDate: referenceDate,
      endDate: referenceDate,
      points: [
        {
          date: referenceDate,
          totalKg: summary.totalKg,
          collectionsCount: summary.collectionsCount,
        },
      ],
    };
  }

  const { startDate, endDate } = getDateRange(referenceDate, "weekly");
  const points = [];

  const cursor = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    const summary = await getDailySummary(date);
    points.push({
      date,
      totalKg: summary.totalKg,
      collectionsCount: summary.collectionsCount,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    period,
    startDate,
    endDate,
    points,
  };
}

export async function insertRouteRun(routeRun) {
  await query(
    `
      INSERT INTO route_runs (
        created_at,
        provider,
        distance_meters,
        duration_seconds,
        stops_count
      )
      VALUES ($1, $2, $3, $4, $5);
    `,
    [
      routeRun.createdAt,
      routeRun.provider,
      routeRun.distanceMeters ?? null,
      routeRun.durationSeconds ?? null,
      routeRun.stopsCount ?? 0,
    ],
  );
}
