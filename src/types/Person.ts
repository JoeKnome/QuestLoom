import type { GameId, PersonId } from './ids'

/**
 * Person (character/NPC) definition (game-scoped).
 * Discovery state (whether discovered in this playthrough) lives in EntityDiscovery.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this person belongs to
 * @property name - Character name
 * @property notes - Optional author notes
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Person {
  /** Unique identifier. */
  id: PersonId
  /** ID of the game this person belongs to. */
  gameId: GameId
  /** Character name. */
  name: string
  /** Optional author notes. */
  notes: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
