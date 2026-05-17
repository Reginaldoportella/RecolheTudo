import { query } from "./postgres.mjs";

function mapRow(row) {
  return {
    remoteId: row.remote_id,
    localId: row.local_id,
    material: row.material,
    weightKg: Number(row.weight_kg),
    collectedAt: row.collected_at instanceof Date
      ? row.collected_at.toISOString()
      : row.collected_at,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : row.created_at,
    latitude: row.latitude,
    longitude: row.longitude,
    locationAccuracy: row.location_accuracy,
    notes: row.notes,
    updatedAt: row.updated_at instanceof Date
      ? row.updated_at.toISOString()
      : row.updated_at,
    deletedAt: row.deleted_at instanceof Date
      ? row.deleted_at.toISOString()
      : row.deleted_at,
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
          material,
          weight_kg,
          collected_at,
          created_at,
          latitude,
          longitude,
          location_accuracy,
          notes,
          updated_at,
          deleted_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NULL)
        ON CONFLICT (remote_id)
        DO UPDATE SET
          local_id = EXCLUDED.local_id,
          material = EXCLUDED.material,
          weight_kg = EXCLUDED.weight_kg,
          collected_at = EXCLUDED.collected_at,
          created_at = EXCLUDED.created_at,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          location_accuracy = EXCLUDED.location_accuracy,
          notes = EXCLUDED.notes,
          updated_at = NOW(),
          deleted_at = NULL
        RETURNING
          remote_id,
          local_id,
          material,
          weight_kg,
          collected_at,
          created_at,
          latitude,
          longitude,
          location_accuracy,
          notes,
          updated_at,
          deleted_at;
      `,
      [
        remoteId,
        item.localId ?? null,
        item.material,
        item.weightKg,
        item.collectedAt,
        item.createdAt ?? item.collectedAt,
        item.latitude ?? null,
        item.longitude ?? null,
        item.locationAccuracy ?? null,
        item.notes ?? null,
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
        material,
        weight_kg,
        collected_at,
        created_at,
        latitude,
        longitude,
        location_accuracy,
        notes,
        updated_at,
        deleted_at
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
    "DELETE FROM collections WHERE remote_id = $1;",
    [remoteId],
  );

  return (result.rowCount ?? 0) > 0;
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
