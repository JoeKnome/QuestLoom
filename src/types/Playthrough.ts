import type { GameId, PlaceId, PlaythroughId } from './ids'

/**
 * Playthrough: one user's run of a game.
 * Scoped to a game; playthrough-scoped data is cleared on "new playthrough."
 */
export interface Playthrough {
  /** Unique identifier. */
  id: PlaythroughId

  /** ID of the game this playthrough belongs to. */

  gameId: GameId
  /** Optional playthrough name. */

  name: string
  /**
   * Typed ID of the current position place for this playthrough.
   * When null, the playthrough has no current position set.
   */
  currentPositionPlaceId: PlaceId | null

  /** Creation timestamp (ISO 8601). */
  createdAt: string

  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
