import * as SQLite from "expo-sqlite";

const DB_NAME = "recolhetudo.db";

interface Migration {
  version: number;
  name: string;
  sql: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "create_collections",
    sql: `
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        material TEXT NOT NULL CHECK(material IN ('papel','plastico','metal','vidro','outros')),
        weight_kg REAL NOT NULL CHECK(weight_kg > 0),
        latitude REAL NULL,
        longitude REAL NULL,
        created_at TEXT NOT NULL,
        notes TEXT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);
      CREATE INDEX IF NOT EXISTS idx_collections_material_created ON collections(material, created_at);
    `,
  },
  {
    version: 2,
    name: "create_route_points",
    sql: `
      CREATE TABLE IF NOT EXISTS route_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        material_preference TEXT NULL,
        last_collected_at TEXT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_route_points_priority ON route_points(priority);
      CREATE INDEX IF NOT EXISTS idx_route_points_material_pref ON route_points(material_preference);
    `,
  },
  {
    version: 3,
    name: "extend_collections_for_mvp",
    sql: `
      ALTER TABLE collections ADD COLUMN weight_range TEXT NOT NULL DEFAULT 'medium';
      ALTER TABLE collections ADD COLUMN estimated_weight_kg REAL;
      ALTER TABLE collections ADD COLUMN location_accuracy REAL NULL;
      ALTER TABLE collections ADD COLUMN collected_at TEXT;

      UPDATE collections
      SET
        estimated_weight_kg = COALESCE(estimated_weight_kg, weight_kg),
        collected_at = COALESCE(collected_at, created_at);

      CREATE INDEX IF NOT EXISTS idx_collections_collected_at ON collections(collected_at);
      CREATE INDEX IF NOT EXISTS idx_collections_material_collected ON collections(material, collected_at);
    `,
  },
  {
    version: 4,
    name: "create_collection_points",
    sql: `
      CREATE TABLE IF NOT EXISTS collection_points (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        address TEXT NULL,
        latitude REAL NULL,
        longitude REAL NULL,
        material_type TEXT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_collection_points_material ON collection_points(material_type);
    `,
  },
  {
    version: 5,
    name: "extend_collection_points_source",
    sql: `
      ALTER TABLE collection_points ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
      ALTER TABLE collection_points ADD COLUMN external_id TEXT NULL;

      CREATE INDEX IF NOT EXISTS idx_collection_points_source_external ON collection_points(source, external_id);
    `,
  },
  {
    version: 6,
    name: "extend_collections_sync_metadata",
    sql: `
      ALTER TABLE collections ADD COLUMN remote_id TEXT NULL;
      ALTER TABLE collections ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending_sync'
        CHECK(sync_status IN ('pending_sync','synced','sync_error'));
      ALTER TABLE collections ADD COLUMN last_synced_at TEXT NULL;

      CREATE INDEX IF NOT EXISTS idx_collections_remote_id ON collections(remote_id);
      CREATE INDEX IF NOT EXISTS idx_collections_sync_status ON collections(sync_status);
    `,
  },
  {
    version: 7,
    name: "create_sync_queue",
    sql: `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL DEFAULT 'collection',
        entity_id INTEGER NULL,
        operation TEXT NOT NULL CHECK(operation IN ('upsert','delete')),
        payload TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        last_attempt_at TEXT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at ON sync_queue(created_at);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
    `,
  },
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function ensureSchemaVersionTable(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ version: number | null }>(
    "SELECT MAX(version) AS version FROM schema_version;",
  );

  return row?.version ?? 0;
}

async function applyMigration(
  db: SQLite.SQLiteDatabase,
  migration: Migration,
): Promise<void> {
  await db.execAsync("BEGIN TRANSACTION;");

  try {
    await db.execAsync(migration.sql);
    await db.runAsync(
      "INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, ?);",
      migration.version,
      migration.name,
      new Date().toISOString(),
    );
    await db.execAsync("COMMIT;");
  } catch (error) {
    await db.execAsync("ROLLBACK;");
    throw error;
  }
}

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await ensureSchemaVersionTable(db);
  const currentVersion = await getCurrentVersion(db);

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await applyMigration(db, migration);
    }
  }
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync("PRAGMA foreign_keys = ON;");
      await db.execAsync("PRAGMA journal_mode = WAL;");
      await runMigrations(db);
      return db;
    })();
  }

  return dbPromise;
}
