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
import { THREAD_ENDPOINT_ENTITY_TYPES } from '../../types/EntityType'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type {
  CreateMapMarkerInput,
  IMapMarkerRepository,
} from './IMapMarkerRepository'

/**
 * Ensures that a value is a finite number; throws otherwise.
 *
 * @param value - Value to validate.
 * @param fieldName - Name of the field for error messages.
 */
function assertFiniteNumber(value: number, fieldName: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number`)
  }
}

/**
 * Dexie-backed implementation of IMapMarkerRepository.
 */
class MapMarkerRepositoryImpl implements IMapMarkerRepository {
  async getByMapId(
    gameId: GameId,
    mapId: MapId,
    playthroughId?: PlaythroughId | null
  ): Promise<MapMarker[]> {
    const collection = db.mapMarkers
      .where('gameId')
      .equals(gameId)
      .and((row) => row.mapId === mapId)

    // For now, always return all markers for the map; callers can filter by
    // playthroughId as needed. The parameter is reserved for future indexing.
    const markers = await collection.toArray()

    if (!playthroughId) {
      return markers
    }

    return markers.filter(
      (marker) =>
        marker.playthroughId === undefined ||
        marker.playthroughId === null ||
        marker.playthroughId === playthroughId
    )
  }

  async create(input: CreateMapMarkerInput): Promise<MapMarker> {
    if (!THREAD_ENDPOINT_ENTITY_TYPES.includes(input.entityType)) {
      throw new Error(
        'Map markers can only reference eligible endpoint entities'
      )
    }

    assertFiniteNumber(input.position.x, 'position.x')
    assertFiniteNumber(input.position.y, 'position.y')

    const now = new Date().toISOString()
    const marker: MapMarker = {
      id: generateId(),
      gameId: input.gameId,
      mapId: input.mapId,
      playthroughId: input.playthroughId ?? undefined,
      entityType: input.entityType,
      entityId: input.entityId,
      position: {
        x: input.position.x,
        y: input.position.y,
      },
      createdAt: now,
      updatedAt: now,
    }

    await db.mapMarkers.add(marker)
    return marker
  }

  async update(marker: MapMarker): Promise<void> {
    assertFiniteNumber(marker.position.x, 'position.x')
    assertFiniteNumber(marker.position.y, 'position.y')

    const updated: MapMarker = {
      ...marker,
      updatedAt: new Date().toISOString(),
    }
    await db.mapMarkers.put(updated)
  }

  async delete(id: string): Promise<void> {
    await db.mapMarkers.delete(id)
  }

  async deleteByMapId(gameId: GameId, mapId: MapId): Promise<void> {
    await db.mapMarkers
      .where('gameId')
      .equals(gameId)
      .and((row) => row.mapId === mapId)
      .delete()
  }

  async deleteByEntity(
    gameId: GameId,
    entityType: EntityType,
    entityId: QuestId | InsightId | ItemId | PersonId | PlaceId
  ): Promise<void> {
    await db.mapMarkers
      .where('gameId')
      .equals(gameId)
      .and(
        (row) =>
          row.entityType === entityType && (row.entityId as string) === entityId
      )
      .delete()
  }
}

/** Single map marker repository instance. */
export const mapMarkerRepository: IMapMarkerRepository =
  new MapMarkerRepositoryImpl()
