import type { Thread } from '../../types/Thread'
import type { GameId, PlaythroughId, ThreadId } from '../../types/ids'
import type { CreateThreadInput } from './CreateThreadInput'

/**
 * Contract for thread data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IThreadRepository {
  /**
   * Returns threads for a game; optionally scoped by playthrough.
   * When playthroughId is omitted, returns all threads for the game.
   * When playthroughId is null, returns only game-level threads (no playthrough-only).
   * When playthroughId is set, returns game-level threads plus that playthrough's threads only.
   *
   * @param gameId - The ID of the game.
   * @param playthroughId - Optional. Null = game-level only; set = game-level + that playthrough.
   * @returns Threads for the game (filtered by playthrough when provided).
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
