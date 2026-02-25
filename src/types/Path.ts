import type { GameId, PathId } from './ids'

/**
 * Path (game-scoped): connects only to Places via threads.
 * Connectivity is Place ↔ Thread ↔ Path ↔ Thread ↔ Place.
 * Status is playthrough-scoped (PathProgress).
 */
export interface Path {
  /** Unique identifier. */
  id: PathId

  /** ID of the game this path belongs to. */
  gameId: GameId

  /** Path name. */
  name: string

  /** Optional description. */
  description?: string

  /** Creation timestamp (ISO 8601). */
  createdAt: string

  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
