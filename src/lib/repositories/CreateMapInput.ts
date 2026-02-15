import type { GameId } from '../../types/ids'
import type { MapMarker } from '../../types/Map'

/**
 * Input for creating a map.
 * ID and timestamps are set by the repository.
 */
export interface CreateMapInput {
  /** ID of the game this map belongs to. */
  gameId: GameId
  /** Map label. */
  name: string
  /** URL or blob reference to map image. */
  imageUrl: string
  /** Markers (placeId, position, label). */
  markers?: MapMarker[]
}
