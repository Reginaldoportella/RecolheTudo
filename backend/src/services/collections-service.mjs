import {
  deleteCollection,
  listCollections,
  upsertCollections,
} from "../data/collections-repository.mjs";

export async function syncCollections(payload) {
  const collections = Array.isArray(payload?.collections) ? payload.collections : [];
  const acceptedCollections = await upsertCollections(collections);

  return {
    acceptedCollections,
    syncCursor: new Date().toISOString(),
    receivedCount: collections.length,
  };
}

export async function getCollections(limit = 50) {
  return listCollections(limit);
}

export async function removeCollection(remoteId) {
  return deleteCollection(remoteId);
}
