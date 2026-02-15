import type { GameId, MapId } from '../../types/ids'

/**
 * Input for creating a place.
 * ID and timestamps are set by the repository.
 */
export interface CreatePlaceInput {
  /** ID of the game this place belongs to. */
  gameId: GameId
  /** Location name. */
  name: string
  /** Optional notes. */
  notes?: string
  /** Optional ID of the map this place is linked to. */
  map?: MapId
}
