import type { Place } from '../../types/Place'
import type { GameId, PlaceId } from '../../types/ids'
import type { CreatePlaceInput } from './CreatePlaceInput'

/**
 * Contract for place data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IPlaceRepository {
  /**
   * Returns all places for a game.
   *
   * @param gameId - The ID of the game.
   * @returns All places for the game.
   */
  getByGameId(gameId: GameId): Promise<Place[]>

  /**
   * Returns a place by ID.
   *
   * @param id - The ID of the place.
   * @returns The place, or undefined if not found.
   */
  getById(id: PlaceId): Promise<Place | undefined>

  /**
   * Creates a place; ID and timestamps are set by the repository.
   *
   * @param input - The input to create the place.
   * @returns The created place.
   */
  create(input: CreatePlaceInput): Promise<Place>

  /**
   * Updates an existing place; updatedAt is set by the repository.
   *
   * @param place - The place to update.
   */
  update(place: Place): Promise<void>

  /**
   * Deletes a place by ID.
   *
   * @param id - The ID of the place to delete.
   */
  delete(id: PlaceId): Promise<void>

  /**
   * Deletes all places for a game (cascade when deleting game).
   *
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>
}
