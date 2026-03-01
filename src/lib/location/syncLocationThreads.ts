import type { GameId, PlaceId } from '../../types/ids'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { getThreadSubtype } from '../../utils/threadSubtype'
import { threadRepository } from '../repositories'

/**
 * Syncs LOCATION threads for an entity: removes all existing LOCATION threads,
 * then creates one per place ID. Call after create/update of the entity.
 *
 * @param gameId - Game ID.
 * @param entityId - Entity ID.
 * @param placeIds - Place IDs to link via LOCATION threads.
 */
export async function syncLocationThreads(
  gameId: GameId,
  entityId: string,
  placeIds: PlaceId[]
): Promise<void> {
  const threads = await threadRepository.getThreadsFromEntity(
    gameId,
    entityId,
    null
  )
  const locationThreads = threads.filter(
    (t) => getThreadSubtype(t) === ThreadSubtype.LOCATION
  )
  for (const t of locationThreads) {
    await threadRepository.delete(t.id)
  }
  for (const placeId of placeIds) {
    await threadRepository.create({
      gameId,
      sourceId: entityId,
      targetId: placeId,
      subtype: ThreadSubtype.LOCATION,
    })
  }
}
