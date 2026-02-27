/**
 * Singleton playthrough repository for the app.
 * Use this instead of Dexie directly; implements IPlaythroughRepository against IndexedDB.
 */

import type { Playthrough } from '../../types/Playthrough'
import type { GameId, PlaythroughId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type { CreatePlaythroughInput } from './CreatePlaythroughInput'
import { entityDiscoveryRepository } from './EntityDiscoveryRepository'
import type { IPlaythroughRepository } from './IPlaythroughRepository'
import { insightRepository } from './InsightRepository'
import { itemRepository } from './ItemRepository'
import { personRepository } from './PersonRepository'
import { questRepository } from './QuestRepository'
import { threadRepository } from './ThreadRepository'

/**
 * Dexie-backed implementation of IPlaythroughRepository.
 * Uses the shared db instance; do not call Dexie from outside lib.
 */
class PlaythroughRepositoryImpl implements IPlaythroughRepository {
  async create(input: CreatePlaythroughInput): Promise<Playthrough> {
    const now = new Date().toISOString()
    const playthrough: Playthrough = {
      id: generateId() as PlaythroughId,
      gameId: input.gameId,
      name: input.name ?? '',
      currentPositionPlaceId: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.playthroughs.add(playthrough)
    return playthrough
  }

  async getByGameId(gameId: GameId): Promise<Playthrough[]> {
    return db.playthroughs.where('gameId').equals(gameId).toArray()
  }

  async getById(id: PlaythroughId): Promise<Playthrough | undefined> {
    return db.playthroughs.get(id)
  }

  async update(playthrough: Playthrough): Promise<void> {
    const updated: Playthrough = {
      ...playthrough,
      updatedAt: new Date().toISOString(),
    }
    await db.playthroughs.put(updated)
  }

  async delete(id: PlaythroughId): Promise<void> {
    await questRepository.deleteProgressByPlaythroughId(id)
    await insightRepository.deleteProgressByPlaythroughId(id)
    await itemRepository.deleteStateByPlaythroughId(id)
    await personRepository.deleteProgressByPlaythroughId(id)
    await entityDiscoveryRepository.deleteByPlaythroughId(id)
    await threadRepository.deleteByPlaythroughId(id)
    await db.playthroughs.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.playthroughs.where('gameId').equals(gameId).delete()
  }
}

/** Single playthrough repository instance. Use this instead of Dexie directly. */
export const playthroughRepository: IPlaythroughRepository =
  new PlaythroughRepositoryImpl()
