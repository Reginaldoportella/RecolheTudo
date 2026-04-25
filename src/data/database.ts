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
