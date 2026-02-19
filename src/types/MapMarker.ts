import type {
  GameId,
  MapId,
  PlaythroughId,
  QuestId,
  InsightId,
  ItemId,
  PersonId,
  PlaceId,
  MapMarkerId,
} from './ids'
import { EntityType } from './EntityType'

/**
 * Map marker: a pinned reference to an entity at a logical position on a map.
 *
 * Markers live in a map-local logical coordinate space that is independent of the
 * underlying image resolution. Coordinates are finite numbers but are not
 * clamped to the image bounds so that markers can exist at or beyond the
 * periphery of the image. Robust re-alignment when images change dimensions is
 * handled in a later phase.
 */
export interface MapMarker {
  /** Unique identifier for this marker. */
  id: MapMarkerId
  /** ID of the game this marker belongs to. */
  gameId: GameId
  /** ID of the map the marker is placed on. */
  mapId: MapId
  /**
   * Optional playthrough that owns this marker.
   * When set, the marker is scoped to a specific playthrough; when undefined,
   * the marker is shared across all playthroughs for the game.
   */
  playthroughId?: PlaythroughId
  /**
   * Type of the entity this marker represents.
   * Restricted to the same set used for thread endpoints (quests, insights, items, people, places).
   */
  entityType: EntityType
  /**
   * ID of the entity this marker represents.
   * Must correspond to the provided entityType.
   */
  entityId: QuestId | InsightId | ItemId | PersonId | PlaceId
  /**
   * Logical coordinates in the map's coordinate space.
   * Values are finite numbers but not clamped to image bounds so markers can
   * appear at or beyond the periphery of the image.
   */
  position: {
    /** Logical horizontal coordinate in map space. */
    x: number
    /** Logical vertical coordinate in map space. */
    y: number
  }
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
