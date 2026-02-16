import type { Thread } from '../../types/Thread'
import type { GameId, PlaythroughId, ThreadId } from '../../types/ids'
import type { CreateThreadInput } from './CreateThreadInput'

/**
 * Contract for thread data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IThreadRepository {
  /**
   * Returns all threads for a game; optionally filter by playthrough.
   *
   * @param gameId - The ID of the game.
   * @param playthroughId - The ID of the playthrough.
   * @returns All threads for the game.
   */
  getByGameId(
    gameId: GameId,
    playthroughId?: PlaythroughId | null
  ): Promise<Thread[]>

  /**
   * Returns a thread by ID.
   *
   * @param id - The ID of the thread.
   * @returns The thread, or undefined if not found.
   */
  getById(id: ThreadId): Promise<Thread | undefined>

  /**
   * Creates a thread; ID and createdAt are set by the repository.
   *
   * @param input - The input to create the thread.
   * @returns The created thread.
   */
  create(input: CreateThreadInput): Promise<Thread>

  /**
   * Updates an existing thread.
   *
   * @param thread - The thread to update.
   */
  update(thread: Thread): Promise<void>

  /**
   * Deletes a thread by ID.
   *
   * @param id - The ID of the thread to delete.
   */
  delete(id: ThreadId): Promise<void>

  /**
   * Deletes all threads for a game (cascade when deleting game).
   *
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /**
   * Deletes all threads for a playthrough (cascade when deleting playthrough).
   *
   * @param playthroughId - The ID of the playthrough to delete.
   */
  deleteByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
