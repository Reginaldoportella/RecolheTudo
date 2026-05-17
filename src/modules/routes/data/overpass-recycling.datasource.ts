import type { CollectionPoint } from "../domain/collection-point.entity";

type OverpassElementType = "node" | "way" | "relation";

interface OverpassElement {
  type: OverpassElementType;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat?: number;
    lon?: number;
  };
  tags?: Record<string, string | undefined>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

export interface RecyclingPointsDatasource {
  findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number,
  ): Promise<CollectionPoint[]>;
}

function buildAddress(tags: Record<string, string | undefined>): string | null {
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];
  const city = tags["addr:city"];
  const parts = [
    street && houseNumber ? `${street}, ${houseNumber}` : street,
    city,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" - ") : null;
}

function mapMaterialType(tags: Record<string, string | undefined>): string | null {
  const materials = [
    "paper",
    "plastic",
    "metal",
    "glass",
    "clothes",
    "batteries",
    "electronics",
  ].filter((key) => tags[`recycling:${key}`] === "yes");

  return materials.length > 0 ? materials.join(",") : null;
}

export function mapOverpassElementToCollectionPoint(
  element: OverpassElement,
  nowIso: string,
): CollectionPoint | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (latitude == null || longitude == null) {
    return null;
  }

  const tags = element.tags ?? {};
  const externalId = `${element.type}/${element.id}`;
  const name =
    tags.name ??
    tags.operator ??
    tags.brand ??
    "Ponto de reciclagem";

  return {
    id: `osm:${externalId}`,
    name,
    address: buildAddress(tags),
    latitude,
    longitude,
    materialType: mapMaterialType(tags),
    source: "osm",
    externalId,
    createdAt: nowIso,
  };
}

export function mapOverpassResponseToCollectionPoints(
  response: OverpassResponse,
  nowIso = new Date().toISOString(),
): CollectionPoint[] {
  const points = response.elements
    ?.map((element) => mapOverpassElementToCollectionPoint(element, nowIso))
    .filter((point): point is CollectionPoint => point !== null);

  return points ?? [];
}

function buildOverpassQuery(
  latitude: number,
  longitude: number,
  radiusMeters: number,
): string {
  return `
    [out:json][timeout:25];
    (
      node["amenity"="recycling"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="recycling"](around:${radiusMeters},${latitude},${longitude});
      relation["amenity"="recycling"](around:${radiusMeters},${latitude},${longitude});
    );
    out center tags;
  `;
}

export const overpassRecyclingDatasource: RecyclingPointsDatasource = {
  async findNearby(latitude, longitude, radiusMeters) {
    const query = buildOverpassQuery(latitude, longitude, radiusMeters);
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ data: query }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OverpassResponse;
    return mapOverpassResponseToCollectionPoints(data);
  },
};
