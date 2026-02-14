/**
 * Repository interface for game CRUD.
 * Implemented by Dexie (local) now; can be implemented by an API client later.
 */

import type { Game } from '../../types/Game'
import type { GameId } from '../../types/ids'
import type { CreateGameInput } from './CreateGameInput'

/**
 * Contract for game data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IGameRepository {
  /**
   * Returns all games.
   * 
   * @returns All games in storage
   */
  getAll(): Promise<Game[]>

  /**
   * Returns a game by ID.
   * 
   * @param id - Game ID
   * @returns The game or undefined
   */
  getById(id: GameId): Promise<Game | undefined>

  /**
   * Creates a game with generated ID and timestamps.
   * 
   * @param input - Name (and optional fields); ID/createdAt/updatedAt are set by the repository
   * @returns The created game
   */
  create(input: CreateGameInput): Promise<Game>

  /**
   * Updates an existing game; updatedAt is set by the repository.
   * 
   * @param game - Full game object
   */
  update(game: Game): Promise<void>

  /** 
   * Deletes a game by ID.
   * 
   * @param id - Game ID
   */
  delete(id: GameId): Promise<void>
}
