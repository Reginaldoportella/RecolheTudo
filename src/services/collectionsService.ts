import { collectionsRepository } from "../data/repositories/collectionsRepository";
import type {
  Collection,
  CollectionInput,
  DailySummary,
  WeeklySummary,
} from "../domain/types/collection";
import { validateCollection } from "../validation/collectionValidation";

export const collectionsService = {
  async createCollection(input: CollectionInput): Promise<{ id: number }> {
    validateCollection(input);
    return collectionsRepository.insertCollection(input);
  },

  async getAllCollections(): Promise<Collection[]> {
    return collectionsRepository.getAllCollections();
  },

  async getDailySummary(date: string): Promise<DailySummary> {
    return collectionsRepository.getDailySummary(date);
  },

  async getWeeklySummary(referenceDate: string): Promise<WeeklySummary> {
    return collectionsRepository.getWeeklySummary(referenceDate);
  },

  async getCollectionsByDate(date: string): Promise<Collection[]> {
    return collectionsRepository.getCollectionsByDate(date);
  },

  async getCollectionsByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Collection[]> {
    return collectionsRepository.getCollectionsByDateRange(startDate, endDate);
  },

  async getRecentCollections(
    limit: number,
    offset: number,
  ): Promise<Collection[]> {
    return collectionsRepository.getRecentCollections(limit, offset);
  },

  async deleteCollection(id: number): Promise<void> {
    const target = await collectionsRepository.getCollectionById(id);

    if (target?.remoteId) {
      await collectionsRepository.enqueueDeleteSync(target.remoteId, id);
    } else {
      await collectionsRepository.deleteQueuedUpsertsByCollectionId(id);
    }

    await collectionsRepository.deleteById(id);
  },
};
