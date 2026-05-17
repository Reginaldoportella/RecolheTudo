export interface RoutePoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  materialPreference: string | null;
  lastCollectedAt: string | null;
  priority: number;
  createdAt: string;
}

export interface RoutePointInput {
  name: string;
  latitude: number;
  longitude: number;
  materialPreference?: string | null;
  priority?: number;
}
