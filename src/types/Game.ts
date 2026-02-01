import type { GameId } from './ids'

/**
 * Game (session container): the intrinsic game world.
 * Persisted with the game; survives "clear progress."
 *
 * @property id - Unique identifier
 * @property name - Game/session name
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Game {
  /** Unique identifier. */
  id: GameId
  /** Game/session name. */
  name: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
