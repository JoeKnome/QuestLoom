import type { GameId, MapId, PlaceId } from './ids'

/**
 * Map marker: a place on the map with position and optional label.
 *
 * @property placeId - ID of the place this marker represents
 * @property position - Coordinates (e.g. { x: number, y: number })
 * @property label - Optional display label
 */
export interface MapMarker {
  /** ID of the place this marker represents. */
  placeId: PlaceId
  /** Coordinates (e.g. { x: number, y: number }). */
  position: { x: number; y: number }
  /** Optional display label. */
  label?: string
}

/**
 * Map definition (game-scoped).
 * Discovery state lives in EntityDiscovery per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this map belongs to
 * @property name - Map label
 * @property imageUrl - URL or blob reference to map image
 * @property markers - Markers (placeId, position, label)
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Map {
  /** Unique identifier. */
  id: MapId
  /** ID of the game this map belongs to. */
  gameId: GameId
  /** Map label. */
  name: string
  /** URL or blob reference to map image. */
  imageUrl: string
  /** Markers (placeId, position, label). */
  markers: MapMarker[]
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
