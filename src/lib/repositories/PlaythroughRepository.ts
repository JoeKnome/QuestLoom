/**
 * Singleton playthrough repository for the app.
 * Use this instead of Dexie directly; implements IPlaythroughRepository against IndexedDB.
 */

import type { Playthrough } from '../../types/Playthrough'
import type { GameId, PlaythroughId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type { CreatePlaythroughInput } from './CreatePlaythroughInput'
import type { IPlaythroughRepository } from './IPlaythroughRepository'

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
      createdAt: now,
      updatedAt: now,
    }
    await db.playthroughs.add(playthrough)
    return playthrough
  }

  async getByGameId(gameId: GameId): Promise<Playthrough[]> {
    return db.playthroughs.where('gameId').equals(gameId).toArray()
  }
}

/** Single playthrough repository instance. Use this instead of Dexie directly. */
export const playthroughRepository: IPlaythroughRepository =
  new PlaythroughRepositoryImpl()
