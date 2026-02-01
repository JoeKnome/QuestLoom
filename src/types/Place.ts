import type { GameId, MapId, PlaceId } from './ids'

/**
 * Place (location) definition (game-scoped).
 * Discovery state lives in EntityDiscovery per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this place belongs to
 * @property name - Location name
 * @property notes - Optional notes
 * @property map - Optional ID of the map this place is linked to
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Place {
  /** Unique identifier. */
  id: PlaceId
  /** ID of the game this place belongs to. */
  gameId: GameId
  /** Location name. */
  name: string
  /** Optional notes. */
  notes: string
  /** Optional ID of the map this place is linked to. */
  map?: MapId
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
