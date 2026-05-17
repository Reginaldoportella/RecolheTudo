import { Client, Pool } from "pg";

import env from "../config/env.mjs";

let pool = null;

function getDatabaseName(connectionString) {
  const url = new URL(connectionString);
  return url.pathname.replace(/^\//, "") || "postgres";
}

function withDatabaseName(connectionString, databaseName) {
  const url = new URL(connectionString);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

async function canConnect(connectionString) {
  const probePool = new Pool({ connectionString });

  try {
    await probePool.query("SELECT 1;");
    return true;
  } finally {
    await probePool.end();
  }
}

async function ensureDatabaseExists() {
  try {
    const ready = await canConnect(env.databaseUrl);

    if (ready) {
      return;
    }
  } catch (error) {
    if (error?.code !== "3D000") {
      throw error;
    }
  }

  const targetDatabase = getDatabaseName(env.databaseUrl);
  const adminCandidates = targetDatabase === "postgres"
    ? ["template1"]
    : ["postgres", "template1"];

  let lastError = null;

  for (const adminDatabase of adminCandidates) {
    const client = new Client({
      connectionString: withDatabaseName(env.databaseUrl, adminDatabase),
    });

    try {
      await client.connect();

      const existingDatabase = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1;",
        [targetDatabase],
      );

      if (existingDatabase.rowCount === 0) {
        await client.query(`CREATE DATABASE ${quoteIdentifier(targetDatabase)};`);
      }

      return;
    } catch (error) {
      lastError = error;
    } finally {
      await client.end().catch(() => {});
    }
  }

  throw lastError ?? new Error(`Nao foi possivel preparar o banco ${targetDatabase}.`);
}

export async function initDatabase() {
  await ensureDatabaseExists();

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
    });
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      remote_id TEXT PRIMARY KEY,
      local_id INTEGER NULL,
      material TEXT NOT NULL CHECK (material IN ('papel', 'plastico', 'metal', 'vidro', 'outros')),
      weight_kg DOUBLE PRECISION NOT NULL CHECK (weight_kg > 0),
      collected_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      latitude DOUBLE PRECISION NULL,
      longitude DOUBLE PRECISION NULL,
      location_accuracy DOUBLE PRECISION NULL,
      notes TEXT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ NULL
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_collections_collected_at
      ON collections (collected_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS route_runs (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL,
      provider TEXT NOT NULL,
      distance_meters DOUBLE PRECISION NULL,
      duration_seconds DOUBLE PRECISION NULL,
      stops_count INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error("Pool PostgreSQL nao inicializado.");
  }

  return pool.query(text, params);
}

export async function inspectState(collectionPointsCount) {
  const [collectionsResult, routeRunsResult] = await Promise.all([
    query("SELECT COUNT(*)::int AS count FROM collections WHERE deleted_at IS NULL;"),
    query("SELECT COUNT(*)::int AS count FROM route_runs;"),
  ]);

  return {
    collectionsCount: collectionsResult.rows[0]?.count ?? 0,
    collectionPointsCount,
    routeRunsCount: routeRunsResult.rows[0]?.count ?? 0,
  };
}
