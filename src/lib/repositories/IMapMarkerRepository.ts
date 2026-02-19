import type { MapMarker } from '../../types/MapMarker'
import type {
  EntityType,
  GameId,
  MapId,
  PlaythroughId,
  QuestId,
  InsightId,
  ItemId,
  PersonId,
  PlaceId,
} from '../../types'

/**
 * Input used when creating a new map marker.
 * ID and timestamps are assigned by the repository.
 */
export interface CreateMapMarkerInput {
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
   * Must be one of the thread endpoint entity types (quest, insight, item, person, place).
   */
  entityType: EntityType
  /**
   * ID of the entity this marker represents.
   * Must correspond to the provided entityType.
   */
  entityId: QuestId | InsightId | ItemId | PersonId | PlaceId
  /**
   * Optional short description used to differentiate markers for the same
   * entity (for example, \"at bar\" vs \"after raid\").
   */
  label?: string
  /**
   * Logical coordinates in the map's coordinate space.
   * Values must be finite numbers but are not clamped to the image bounds.
   */
  position: {
    /** Logical horizontal coordinate in map space. */
    x: number
    /** Logical vertical coordinate in map space. */
    y: number
  }
}

/**
 * Contract for map marker data access.
 * Repositories encapsulate Dexie usage so the same interface can later be
 * implemented by a remote API client.
 */
export interface IMapMarkerRepository {
  /**
   * Returns all markers for a map within a game.
   *
   * When playthroughId is provided, implementations may optionally include
   * both game-shared and playthrough-specific markers; callers can further
   * filter as needed.
   *
   * @param gameId - The game ID to scope the query.
   * @param mapId - The map ID to load markers for.
   * @param playthroughId - Optional playthrough ID for playthrough-scoped markers.
   * @returns All markers matching the criteria.
   */
  getByMapId(
    gameId: GameId,
    mapId: MapId,
    playthroughId?: PlaythroughId | null
  ): Promise<MapMarker[]>

  /**
   * Creates a new map marker.
   *
   * Implementations must enforce entity eligibility and basic coordinate
   * validation (finite numbers) but do not clamp to image bounds.
   *
   * @param input - Input describing the marker to create.
   * @returns The created marker.
   */
  create(input: CreateMapMarkerInput): Promise<MapMarker>

  /**
   * Updates an existing map marker.
   *
   * Implementations should preserve the provided logical coordinates and
   * update the updatedAt timestamp.
   *
   * @param marker - The marker to update.
   */
  update(marker: MapMarker): Promise<void>

  /**
   * Deletes a marker by ID.
   *
   * @param id - The ID of the marker to delete.
   */
  delete(id: string): Promise<void>

  /**
   * Deletes all markers for a given game and map.
   *
   * @param gameId - The game ID to scope the delete.
   * @param mapId - The map ID to delete markers for.
   */
  deleteByMapId(gameId: GameId, mapId: MapId): Promise<void>

  /**
   * Deletes all markers referencing a given entity in a game.
   *
   * @param gameId - The game ID to scope the delete.
   * @param entityType - The type of the referenced entity.
   * @param entityId - The ID of the referenced entity.
   */
  deleteByEntity(
    gameId: GameId,
    entityType: EntityType,
    entityId: QuestId | InsightId | ItemId | PersonId | PlaceId
  ): Promise<void>
}
