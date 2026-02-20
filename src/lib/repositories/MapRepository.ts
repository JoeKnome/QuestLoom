/**
 * Singleton map repository for the app.
 * Use this instead of Dexie directly; implements IMapRepository against IndexedDB.
 */

import type { Map } from '../../types/Map'
import { EntityType } from '../../types/EntityType'
import type { GameId, MapId } from '../../types/ids'
import { generateEntityId, generateId } from '../../utils/generateId'
import { db, type MapImageBlobRow } from '../db'
import { deleteThreadsForEntity } from './cascadeDeleteThreads'
import type { CreateMapInput } from './CreateMapInput'
import type { IMapRepository } from './IMapRepository'
import { mapMarkerRepository } from './MapMarkerRepository'

/**
 * Dexie-backed implementation of IMapRepository.
 */
class MapRepositoryImpl implements IMapRepository {
  async getByGameId(gameId: GameId): Promise<Map[]> {
    return db.maps.where('gameId').equals(gameId).toArray()
  }

  async getById(id: MapId): Promise<Map | undefined> {
    return db.maps.get(id)
  }

  async create(input: CreateMapInput): Promise<Map> {
    const now = new Date().toISOString()
    const map: Map = {
      id: generateEntityId(EntityType.MAP) as MapId,
      gameId: input.gameId,
      name: input.name,
      imageSourceType: input.imageSourceType,
      imageUrl: input.imageUrl ?? '',
      imageBlobId: input.imageBlobId,
      createdAt: now,
      updatedAt: now,
    }
    await db.maps.add(map)
    return map
  }

  async update(map: Map): Promise<void> {
    const updated: Map = {
      ...map,
      updatedAt: new Date().toISOString(),
    }
    await db.maps.put(updated)
  }

  async delete(id: MapId): Promise<void> {
    const map = await db.maps.get(id)
    if (map) {
      if (map.imageSourceType === 'upload' && map.imageBlobId) {
        await db.mapImages.delete(map.imageBlobId)
      }
      await deleteThreadsForEntity(map.gameId, id)

      await mapMarkerRepository.deleteByMapId(map.gameId, id)

      const scopedPlaces = await db.places
        .where('gameId')
        .equals(map.gameId)
        .filter((place) => place.map === id)
        .toArray()
      for (const place of scopedPlaces) {
        await mapMarkerRepository.deleteByEntity(
          map.gameId,
          EntityType.PLACE,
          place.id
        )
        await deleteThreadsForEntity(place.gameId, place.id)
        await db.places.delete(place.id)
      }
    }
    await db.maps.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.mapMarkers.where('gameId').equals(gameId).delete()
    await db.mapImages.where('gameId').equals(gameId).delete()
    await db.maps.where('gameId').equals(gameId).delete()
  }

  async setImageFromUrl(mapId: MapId, url: string): Promise<void> {
    const map = await db.maps.get(mapId)
    if (!map) return
    if (map.imageSourceType === 'upload' && map.imageBlobId) {
      await db.mapImages.delete(map.imageBlobId)
    }
    const updated: Map = {
      ...map,
      imageSourceType: 'url',
      imageUrl: url,
      imageBlobId: undefined,
      updatedAt: new Date().toISOString(),
    }
    await db.maps.put(updated)
  }

  async setImageFromUpload(mapId: MapId, file: File): Promise<void> {
    const map = await db.maps.get(mapId)
    if (!map) return
    if (map.imageSourceType === 'upload' && map.imageBlobId) {
      await db.mapImages.delete(map.imageBlobId)
    }
    const blobId = generateId()
    const row: MapImageBlobRow = {
      id: blobId,
      gameId: map.gameId,
      mapId,
      blob: file,
      createdAt: new Date().toISOString(),
    }
    await db.mapImages.add(row)
    const updated: Map = {
      ...map,
      imageSourceType: 'upload',
      imageUrl: undefined,
      imageBlobId: blobId,
      updatedAt: new Date().toISOString(),
    }
    await db.maps.put(updated)
  }

  async clearImage(mapId: MapId): Promise<void> {
    const map = await db.maps.get(mapId)
    if (!map) return
    if (map.imageSourceType === 'upload' && map.imageBlobId) {
      await db.mapImages.delete(map.imageBlobId)
    }
    const updated: Map = {
      ...map,
      imageSourceType: undefined,
      imageUrl: undefined,
      imageBlobId: undefined,
      updatedAt: new Date().toISOString(),
    }
    await db.maps.put(updated)
  }

  async getMapImageDisplayUrl(
    mapId: MapId
  ): Promise<{ url: string; revoke?: () => void } | null> {
    const map = await db.maps.get(mapId)
    if (!map) return null

    const hasUrl =
      map.imageSourceType === 'url' ||
      (map.imageUrl != null && map.imageUrl.trim() !== '')
    if (hasUrl && map.imageUrl) {
      return { url: map.imageUrl }
    }

    if (
      (map.imageSourceType === 'upload' || map.imageBlobId) &&
      map.imageBlobId
    ) {
      const row = await db.mapImages.get(map.imageBlobId)
      if (!row) return null
      const url = URL.createObjectURL(row.blob)
      return {
        url,
        revoke: () => URL.revokeObjectURL(url),
      }
    }

    return null
  }
}

/** Single map repository instance. */
export const mapRepository: IMapRepository = new MapRepositoryImpl()
