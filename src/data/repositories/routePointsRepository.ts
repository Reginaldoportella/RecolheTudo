import { getDatabase } from "../database";
import type {
  RoutePoint,
  RoutePointInput,
} from "../../domain/types/routePoint";

interface RoutePointRow {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  material_preference: string | null;
  last_collected_at: string | null;
  priority: number;
  created_at: string;
}

function mapRowToRoutePoint(row: RoutePointRow): RoutePoint {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    materialPreference: row.material_preference,
    lastCollectedAt: row.last_collected_at,
    priority: row.priority,
    createdAt: row.created_at,
  };
}

export interface RoutePointsRepository {
  getAllRoutePoints(): Promise<RoutePoint[]>;
  insertRoutePoint(input: RoutePointInput): Promise<{ id: number }>;
  updateLastCollected(id: number, timestamp: string): Promise<void>;
}

export const routePointsRepository: RoutePointsRepository = {
  async getAllRoutePoints() {
    const db = await getDatabase();

    const rows = await db.getAllAsync<RoutePointRow>(
      `
        SELECT id, name, latitude, longitude, material_preference,
               last_collected_at, priority, created_at
        FROM route_points
        ORDER BY priority DESC, name ASC;
      `,
    );

    return rows.map(mapRowToRoutePoint);
  },

  async insertRoutePoint(input) {
    const db = await getDatabase();

    const result = await db.runAsync(
      `
        INSERT INTO route_points (name, latitude, longitude, material_preference, priority, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
      input.name,
      input.latitude,
      input.longitude,
      input.materialPreference ?? null,
      input.priority ?? 0,
      new Date().toISOString(),
    );

    return { id: Number(result.lastInsertRowId) };
  },

  async updateLastCollected(id, timestamp) {
    const db = await getDatabase();

    await db.runAsync(
      "UPDATE route_points SET last_collected_at = ? WHERE id = ?;",
      timestamp,
      id,
    );
  },
};
