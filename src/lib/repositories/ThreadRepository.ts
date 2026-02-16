/**
 * Singleton thread repository for the app.
 * Use this instead of Dexie directly; implements IThreadRepository against IndexedDB.
 */

import type { Thread } from '../../types/Thread'
import type { GameId, PlaythroughId, ThreadId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db } from '../db'
import type { CreateThreadInput } from './CreateThreadInput'
import type { IThreadRepository } from './IThreadRepository'

/**
 * Dexie-backed implementation of IThreadRepository.
 */
class ThreadRepositoryImpl implements IThreadRepository {
  async getByGameId(
    gameId: GameId,
    playthroughId?: PlaythroughId | null
  ): Promise<Thread[]> {
    const collection = db.threads.where('gameId').equals(gameId)
    if (playthroughId !== undefined) {
      return collection
        .filter((t) =>
          playthroughId === null
            ? t.playthroughId == null
            : t.playthroughId == null || t.playthroughId === playthroughId
        )
        .toArray()
    }
    return collection.toArray()
  }

  async getById(id: ThreadId): Promise<Thread | undefined> {
    return db.threads.get(id)
  }

  async create(input: CreateThreadInput): Promise<Thread> {
    const now = new Date().toISOString()
    const thread: Thread = {
      id: generateId() as ThreadId,
      gameId: input.gameId,
      playthroughId: input.playthroughId ?? undefined,
      sourceId: input.sourceId,
      sourceType: input.sourceType,
      targetId: input.targetId,
      targetType: input.targetType,
      label: input.label ?? '',
      createdAt: now,
    }
    await db.threads.add(thread)
    return thread
  }

  async update(thread: Thread): Promise<void> {
    await db.threads.put(thread)
  }

  async delete(id: ThreadId): Promise<void> {
    await db.threads.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.threads.where('gameId').equals(gameId).delete()
  }

  async deleteByPlaythroughId(playthroughId: PlaythroughId): Promise<void> {
    await db.threads.where('playthroughId').equals(playthroughId).delete()
  }
}

/** Single thread repository instance. */
export const threadRepository: IThreadRepository = new ThreadRepositoryImpl()
