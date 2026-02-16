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
      case EntityType.MAP:
      case EntityType.THREAD:
        return entityId
      default:
        return entityId
    }
  } catch {
    return entityId
  }
}

/**
 * Fetches the display name for a quest giver (person or place by ID).
 * Tries person first, then place; used when the giver is stored as an ID only.
 *
 * @param _gameId - Game ID (unused; getById is sufficient for lookup)
 * @param giverId - Person or place entity ID
 * @returns The display name (person name or place name), or the id if not found
 */
export async function getGiverDisplayName(
  _gameId: GameId,
  giverId: string
): Promise<string> {
  if (!giverId.trim()) return ''
  try {
    const person = await personRepository.getById(giverId)
    if (person != null) return person.name
    const place = await placeRepository.getById(giverId)
    return place?.name ?? giverId
  } catch {
    return giverId
  }
}
