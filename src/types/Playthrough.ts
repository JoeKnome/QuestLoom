import type { GameId, PlaythroughId } from './ids'

/**
 * Playthrough: one user's run of a game.
 * Scoped to a game; playthrough-scoped data is cleared on "new playthrough."
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this playthrough belongs to
 * @property name - Optional playthrough name
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Playthrough {
  /** Unique identifier. */
  id: PlaythroughId
  /** ID of the game this playthrough belongs to. */
  gameId: GameId
  /** Optional playthrough name. */
  name: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
