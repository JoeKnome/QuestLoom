import { EntityType } from '../../types/EntityType'
import type { GameId, PlaceId } from '../../types/ids'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import { getThreadSubtype } from '../../utils/threadSubtype'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { threadRepository } from '../repositories'

/**
 * Returns all Place IDs at which the given entity is located.
 * Location is represented by LOCATION threads (entity to Place); a Place is "at itself".
 *
 * @param gameId - Current game ID.
 * @param entityId - Typed entity ID (quest, insight, item, person, place, path).
 * @returns List of place IDs (empty if none; Place entity returns [entityId]).
 */
export async function getEntityLocationPlaceIds(
  gameId: GameId,
  entityId: string
): Promise<PlaceId[]> {
  const type = getEntityTypeFromId(entityId)
  if (type === null) return []

  if (type === EntityType.PLACE) {
    return [entityId as PlaceId]
  }

  const threads = await threadRepository.getByGameId(gameId, null)
  const placeIds: PlaceId[] = []
  const seen = new Set<string>()

  for (const t of threads) {
    if (getThreadSubtype(t) !== ThreadSubtype.LOCATION) continue
    const isSource = t.sourceId === entityId
    const isTarget = t.targetId === entityId
    if (!isSource && !isTarget) continue

    const otherId = isSource ? t.targetId : t.sourceId
    const otherType = getEntityTypeFromId(otherId)
    if (otherType !== EntityType.PLACE) continue

    if (!seen.has(otherId)) {
      seen.add(otherId)
      placeIds.push(otherId as PlaceId)
    }
  }

  return placeIds
}
