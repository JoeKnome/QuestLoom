/**
 * Singleton game repository for the app.
 * Use this instead of Dexie directly; implements IGameRepository against IndexedDB.
 */

import type { Game } from '../../types/Game'
import type { GameId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type { CreateGameInput } from './CreateGameInput'
import type { IGameRepository } from './IGameRepository'
import { playthroughRepository } from './PlaythroughRepository'

/**
 * Dexie-backed implementation of IGameRepository.
 * Uses the shared db instance; do not call Dexie from outside lib.
 */
class GameRepositoryImpl implements IGameRepository {
  async getAll(): Promise<Game[]> {
    return db.games.toArray()
  }

  async getById(id: GameId): Promise<Game | undefined> {
    return db.games.get(id)
  }

  async create(input: CreateGameInput): Promise<Game> {
    const now = new Date().toISOString()
    const game: Game = {
      id: generateId() as GameId,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    }
    await db.games.add(game)
    return game
  }

  async update(game: Game): Promise<void> {
    const updated: Game = {
      ...game,
      updatedAt: new Date().toISOString(),
    }
    await db.games.put(updated)
  }

  async delete(id: GameId): Promise<void> {
    await playthroughRepository.deleteByGameId(id)
    await db.games.delete(id)
  }
}

/** Single game repository instance. Use this instead of Dexie directly. */
export const gameRepository: IGameRepository = new GameRepositoryImpl()
