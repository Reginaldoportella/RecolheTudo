import {
  collectionPointsRepository,
  type CollectionPointsRepository,
} from "../data/collection-points.repository";
import type { CollectionPointInput } from "../domain/collection-point.entity";

export async function createManualCollectionPointUseCase(
  input: CollectionPointInput,
  repository: CollectionPointsRepository = collectionPointsRepository,
): Promise<void> {
  await repository.createManual({
    ...input,
    source: "manual",
    externalId: input.externalId ?? null,
  });
}
