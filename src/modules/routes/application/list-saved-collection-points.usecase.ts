import {
  collectionPointsRepository,
  type CollectionPointsRepository,
} from "../data/collection-points.repository";
import type { CollectionPoint } from "../domain/collection-point.entity";

export async function listSavedCollectionPointsUseCase(
  repository: CollectionPointsRepository = collectionPointsRepository,
): Promise<CollectionPoint[]> {
  return repository.findAll();
}
