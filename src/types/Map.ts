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
 * How the map image is provided.
 * Legacy: if imageSourceType is missing but imageUrl is non-empty, treat as 'url'.
 */
export type MapImageSourceType = 'url' | 'upload'

/**
 * Map definition (game-scoped). Maps are view-only containers for images and
 * markers; locations in threads and the loom are represented by places,
 * including a single top-level place per map.
 *
 * Discovery state lives in EntityDiscovery per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this map belongs to
 * @property name - Map label
 * @property imageSourceType - How the image is provided ('url' or 'upload'); legacy rows with imageUrl but no type are treated as 'url'
 * @property imageUrl - Used only when imageSourceType === 'url'; HTTP(S) URL to the map image
 * @property imageBlobId - Used only when imageSourceType === 'upload'; references an uploaded image stored by the repository
 * @property markers - Markers (placeId, position, label)
 * @property topLevelPlaceId - ID of the top-level place representing this map in threads and the loom
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
  /** How the image is provided; legacy: missing + non-empty imageUrl is treated as 'url'. */
  imageSourceType?: MapImageSourceType
  /** HTTP(S) URL to map image; used only when imageSourceType === 'url'. */
  imageUrl?: string
  /** Reference to uploaded image in repository storage; used only when imageSourceType === 'upload'. */
  imageBlobId?: string
  /** Markers (placeId, position, label). */
  markers: MapMarker[]
  /**
   * ID of the top-level place that represents this map in threads and the loom.
   * May be undefined for legacy maps created before this association existed.
   */
  topLevelPlaceId?: PlaceId
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
