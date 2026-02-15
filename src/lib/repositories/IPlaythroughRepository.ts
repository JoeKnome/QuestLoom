/**
 * Repository interface for playthrough CRUD.
 * Implemented by Dexie (local) now; can be implemented by an API client later.
 */

import type { Playthrough } from '../../types/Playthrough'
import type { GameId, PlaythroughId } from '../../types/ids'
import type { CreatePlaythroughInput } from './CreatePlaythroughInput'

/**
 * Contract for playthrough data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IPlaythroughRepository {
  /**
   * Creates a playthrough with generated ID and timestamps.
   *
   * @param input - gameId and optional name; ID/createdAt/updatedAt are set by the repository
   * @returns The created playthrough
   */
  create(input: CreatePlaythroughInput): Promise<Playthrough>

  /**
   * Returns all playthroughs for a game.
   *
   * @param gameId - Game ID
   * @returns Playthroughs for that game
   */
  getByGameId(gameId: GameId): Promise<Playthrough[]>

  /**
   * Returns a single playthrough by ID.
   *
   * @param id - Playthrough ID
   * @returns The playthrough, or undefined if not found
   */
  getById(id: PlaythroughId): Promise<Playthrough | undefined>

  /**
   * Updates an existing playthrough (e.g. name). updatedAt is set by the repository.
   *
   * @param playthrough - Playthrough to update
   */
  update(playthrough: Playthrough): Promise<void>

  /**
   * Deletes a single playthrough by ID.
   *
   * @param id - Playthrough ID to delete
   */
  delete(id: PlaythroughId): Promise<void>

  /**
   * Deletes all playthroughs for a game. Used when deleting a game (cascade).
   *
   * @param gameId - Game ID whose playthroughs to delete
   */
  deleteByGameId(gameId: GameId): Promise<void>
}
