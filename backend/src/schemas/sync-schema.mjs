import { ValidationError } from "../utils/http-error.mjs";

function normalizeCollectionsBucket(bucket) {
  const created = Array.isArray(bucket?.created) ? bucket.created : [];
  const updated = Array.isArray(bucket?.updated) ? bucket.updated : [];
  const deleted = Array.isArray(bucket?.deleted) ? bucket.deleted : [];

  return { created, updated, deleted };
}

function ensureString(value, fieldName, { required = false } = {}) {
  if (value == null || value === "") {
    if (required) {
      throw new ValidationError(`${fieldName} e obrigatorio.`);
    }

    return null;
  }

  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} deve ser string.`);
  }

  return value;
}

function ensureTimestamp(value, fieldName, { required = false } = {}) {
  const parsed = ensureString(value, fieldName, { required });

  if (parsed == null) {
    return null;
  }

  if (Number.isNaN(Date.parse(parsed))) {
    throw new ValidationError(`${fieldName} deve ser um timestamp ISO valido.`);
  }

  return parsed;
}

function normalizeCollectionRecord(item, fallbackDeviceId, operation) {
  if (!item || typeof item !== "object") {
    throw new ValidationError(`Item invalido em changes.collections.${operation}.`);
  }

  const remoteId = ensureString(item.remoteId, "remoteId");
  const localId = item.localId == null ? null : String(item.localId);
  const userId = ensureString(item.userId, "userId");
  const deviceId = ensureString(item.deviceId, "deviceId") ?? fallbackDeviceId;

  if (operation !== "deleted") {
    if (!["papel", "plastico", "metal", "vidro", "outros"].includes(item.material)) {
      throw new ValidationError("material deve ser um dos valores suportados.");
    }

    if (typeof item.weightKg !== "number" || !(item.weightKg > 0)) {
      throw new ValidationError("weightKg deve ser maior que zero.");
    }
  }

  return {
    remoteId,
    localId,
    userId,
    deviceId,
    material: operation === "deleted" ? item.material ?? null : item.material,
    weightKg: operation === "deleted" ? item.weightKg ?? null : item.weightKg,
    latitude: typeof item.latitude === "number" ? item.latitude : null,
    longitude: typeof item.longitude === "number" ? item.longitude : null,
    locationAccuracy:
      typeof item.locationAccuracy === "number" ? item.locationAccuracy : null,
    notes: typeof item.notes === "string" ? item.notes : null,
    collectedAt:
      operation === "deleted"
        ? ensureTimestamp(item.collectedAt, "collectedAt")
        : ensureTimestamp(item.collectedAt, "collectedAt", { required: true }),
    createdAt:
      operation === "deleted"
        ? ensureTimestamp(item.createdAt, "createdAt")
        : ensureTimestamp(item.createdAt, "createdAt", { required: true }),
    updatedAt: ensureTimestamp(item.updatedAt, "updatedAt", { required: true }),
    deletedAt: ensureTimestamp(item.deletedAt, "deletedAt"),
    syncMetadata:
      item.syncMetadata && typeof item.syncMetadata === "object"
        ? item.syncMetadata
        : {},
  };
}

export function validateSyncPayload(body) {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Payload de sync invalido.");
  }

  const deviceId = ensureString(body.deviceId, "deviceId", { required: true });
  const userId = ensureString(body.userId, "userId");
  const lastPulledAt = ensureTimestamp(body.lastPulledAt, "lastPulledAt");
  const changes = body.changes;

  if (!changes || typeof changes !== "object") {
    throw new ValidationError("changes e obrigatorio.");
  }

  const collectionsBucket = normalizeCollectionsBucket(changes.collections);

  return {
    deviceId,
    userId,
    lastPulledAt,
    changes: {
      collections: {
        created: collectionsBucket.created.map((item) =>
          normalizeCollectionRecord(item, deviceId, "created")
        ),
        updated: collectionsBucket.updated.map((item) =>
          normalizeCollectionRecord(item, deviceId, "updated")
        ),
        deleted: collectionsBucket.deleted.map((item) =>
          normalizeCollectionRecord(item, deviceId, "deleted")
        ),
      },
    },
  };
}
