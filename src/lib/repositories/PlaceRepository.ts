/**
 * Singleton place repository for the app.
 * Use this instead of Dexie directly; implements IPlaceRepository against IndexedDB.
 */

import type { Place } from '../../types/Place'
import type { GameId, PlaceId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type { CreatePlaceInput } from './CreatePlaceInput'
import type { IPlaceRepository } from './IPlaceRepository'

/**
 * Dexie-backed implementation of IPlaceRepository.
 */
class PlaceRepositoryImpl implements IPlaceRepository {
  async getByGameId(gameId: GameId): Promise<Place[]> {
    return db.places.where('gameId').equals(gameId).toArray()
  }

  async getById(id: PlaceId): Promise<Place | undefined> {
    return db.places.get(id)
  }

  async create(input: CreatePlaceInput): Promise<Place> {
    const now = new Date().toISOString()
    const place: Place = {
      id: generateId() as PlaceId,
      gameId: input.gameId,
      name: input.name,
      notes: input.notes ?? '',
      map: input.map,
      createdAt: now,
      updatedAt: now,
    }
    await db.places.add(place)
    return place
  }

  async update(place: Place): Promise<void> {
    const updated: Place = {
      ...place,
      updatedAt: new Date().toISOString(),
    }
    await db.places.put(updated)
  }

  async delete(id: PlaceId): Promise<void> {
    await db.places.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.places.where('gameId').equals(gameId).delete()
  }
}

/** Single place repository instance. */
export const placeRepository: IPlaceRepository = new PlaceRepositoryImpl()
