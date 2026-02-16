import type { GameId } from '../../types/ids'
import { threadRepository } from './ThreadRepository'

/**
 * Deletes all threads that reference the given entity (as source or target).
 * Call this before deleting an entity so threads are not orphaned.
 *
 * @param gameId - The game the entity belongs to.
 * @param entityId - The entity's typed ID (will be removed from all threads).
 */
export async function deleteThreadsForEntity(
  gameId: GameId,
  entityId: string
): Promise<void> {
  await threadRepository.deleteThreadsInvolvingEntity(gameId, entityId)
}
