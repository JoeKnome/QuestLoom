import type { Map } from '../../types/Map'
import type { GameId, MapId } from '../../types/ids'
import type { CreateMapInput } from './CreateMapInput'

/**
 * Contract for map data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IMapRepository {
  /**
   * Returns all maps for a game.
   *
   * @param gameId - The game ID.
   * @returns All maps for the game.
   */
  getByGameId(gameId: GameId): Promise<Map[]>

  /**
   * Returns a map by ID.
   *
   * @param id - The ID of the map.
   * @returns The map, or undefined if not found.
   */
  getById(id: MapId): Promise<Map | undefined>

  /**
   * Creates a map; ID and timestamps are set by the repository.
   *
   * @param input - The input to create the map.
   * @returns The created map.
   */
  create(input: CreateMapInput): Promise<Map>

  /**
   * Updates an existing map; updatedAt is set by the repository.
   *
   * @param map - The map to update.
   */
  update(map: Map): Promise<void>

  /**
   * Deletes a map by ID.
   *
   * @param id - The ID of the map to delete.
   */
  delete(id: MapId): Promise<void>

  /**
   * Deletes all maps for a game (cascade when deleting game).
   *
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /**
   * Sets the map image to a URL; removes any existing uploaded blob.
   *
   * @param mapId - The map to update.
   * @param url - Valid HTTP(S) URL for the image.
   */
  setImageFromUrl(mapId: MapId, url: string): Promise<void>

  /**
   * Sets the map image from an uploaded file; stores blob and updates map.
   *
   * @param mapId - The map to update.
   * @param file - Image file (e.g. PNG, JPEG, WebP).
   */
  setImageFromUpload(mapId: MapId, file: File): Promise<void>

  /**
   * Clears the map image (removes blob if present, clears URL).
   *
   * @param mapId - The map to update.
   */
  clearImage(mapId: MapId): Promise<void>

  /**
   * Returns a displayable URL for the map image, if any.
   * For URL source returns the map's imageUrl; for upload creates an object URL
   * from the stored blob. Caller must call revoke() on unmount when present to avoid leaks.
   *
   * @param mapId - The map to get the image URL for.
   * @returns Object with url and optional revoke callback, or null if no image.
   */
  getMapImageDisplayUrl(
    mapId: MapId
  ): Promise<{ url: string; revoke?: () => void } | null>
}
