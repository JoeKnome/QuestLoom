/**
 * Singleton map repository for the app.
 * Use this instead of Dexie directly; implements IMapRepository against IndexedDB.
 */

import type { Map } from '../../types/Map'
import type { GameId, MapId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type { CreateMapInput } from './CreateMapInput'
import type { IMapRepository } from './IMapRepository'

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
      id: generateId() as MapId,
      gameId: input.gameId,
      name: input.name,
      imageUrl: input.imageUrl,
      markers: input.markers ?? [],
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
    await db.maps.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.maps.where('gameId').equals(gameId).delete()
  }
}

/** Single map repository instance. */
export const mapRepository: IMapRepository = new MapRepositoryImpl()
