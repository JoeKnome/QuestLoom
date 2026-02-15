import {
  insightRepository,
  itemRepository,
  personRepository,
  placeRepository,
  questRepository,
} from '../lib/repositories'
import type { GameId } from '../types/ids'
import { EntityType } from '../types/EntityType'

/**
 * Fetches the display name for an entity (e.g. quest title, person name).
 * Used when listing threads or showing entity references.
 *
 * @param gameId - Game ID (entities are scoped by game)
 * @param entityType - Type of the entity
 * @param entityId - Entity ID
 * @returns The display label, or the id if not found
 */
export async function getEntityDisplayName(
  _gameId: GameId,
  entityType: EntityType,
  entityId: string
): Promise<string> {
  try {
    switch (entityType) {
      case EntityType.QUEST: {
        const q = await questRepository.getById(entityId)
        return q?.title ?? entityId
      }
      case EntityType.INSIGHT: {
        const i = await insightRepository.getById(entityId)
        return i?.title ?? entityId
      }
      case EntityType.ITEM: {
        const i = await itemRepository.getById(entityId)
        return i?.name ?? entityId
      }
      case EntityType.PERSON: {
        const p = await personRepository.getById(entityId)
        return p?.name ?? entityId
      }
      case EntityType.PLACE: {
        const p = await placeRepository.getById(entityId)
        return p?.name ?? entityId
      }
      default:
        return entityId
    }
  } catch {
    return entityId
  }
}
