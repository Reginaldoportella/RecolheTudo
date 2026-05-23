import { getDatabase } from "../database";
import type {
  CollectionPoint,
  CollectionPointInput,
} from "../../domain/types/collectionPoint";
import { calculateDistanceMeters } from "../../utils/distance";

interface CollectionPointRow {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  material_type: CollectionPoint["materialType"];
  source: CollectionPoint["source"];
  external_id: string | null;
  created_at: string;
}

function mapRowToCollectionPoint(row: CollectionPointRow): CollectionPoint {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    materialType: row.material_type,
    source: row.source,
    externalId: row.external_id,
    createdAt: row.created_at,
  };
}

export interface CollectionPointsRepository {
  upsertMany(points: CollectionPoint[]): Promise<void>;
  create(input: CollectionPointInput): Promise<void>;
  createManual(input: CollectionPointInput): Promise<void>;
  findAll(): Promise<CollectionPoint[]>;
  findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<CollectionPoint[]>;
  deleteById(id: string): Promise<void>;
}

export const collectionPointsRepository: CollectionPointsRepository = {
  async upsertMany(points) {
    const db = await getDatabase();

    for (const point of points) {
      await db.runAsync(
        `
          INSERT INTO collection_points (
            id,
            name,
            address,
            latitude,
            longitude,
            material_type,
            source,
            external_id,
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            address = excluded.address,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            material_type = excluded.material_type,
            source = excluded.source,
            external_id = excluded.external_id;
        `,
        point.id,
        point.name,
        point.address ?? null,
        point.latitude,
        point.longitude,
        point.materialType ?? null,
        point.source,
        point.externalId ?? null,
        point.createdAt,
      );
    }
  },

  async create(input) {
    await collectionPointsRepository.createManual(input);
  },

  async createManual(input) {
    const db = await getDatabase();

    await db.runAsync(
      `
        INSERT INTO collection_points (
          id,
          name,
          address,
          latitude,
          longitude,
          material_type,
          source,
          external_id,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      input.id,
      input.name,
      input.address ?? null,
      input.latitude,
      input.longitude,
      input.materialType ?? null,
      input.source ?? "manual",
      input.externalId ?? null,
      input.createdAt,
    );
  },

  async findAll() {
    const db = await getDatabase();

    const rows = await db.getAllAsync<CollectionPointRow>(
      `
        SELECT id, name, address, latitude, longitude, material_type, source, external_id, created_at
        FROM collection_points
        ORDER BY name ASC;
      `,
    );

    return rows.map(mapRowToCollectionPoint);
  },

  async findNearby(latitude, longitude, radiusMeters) {
    const points = await collectionPointsRepository.findAll();

    return points
      .map((point) => ({
        point,
        distance: calculateDistanceMeters(
          latitude,
          longitude,
          point.latitude,
          point.longitude,
        ),
      }))
      .filter(({ distance }) => distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance)
      .map(({ point }) => point);
  },

  async deleteById(id) {
    const db = await getDatabase();

    await db.runAsync("DELETE FROM collection_points WHERE id = ?;", id);
  },
};
