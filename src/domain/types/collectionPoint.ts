export interface CollectionPoint {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  materialType: string | null;
  source: "osm" | "manual";
  externalId: string | null;
  createdAt: string;
}

export interface CollectionPointInput {
  id: string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  materialType?: string | null;
  source?: "osm" | "manual";
  externalId?: string | null;
  createdAt: string;
}
