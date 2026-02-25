/**
 * Singleton thread repository for the app.
 * Use this instead of Dexie directly; implements IThreadRepository against IndexedDB.
 */

import type { Thread } from '../../types/Thread'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { EntityType } from '../../types/EntityType'
import type { GameId, PlaythroughId, ThreadId } from '../../types/ids'
import { generateEntityId } from '../../utils/generateId'
import {
  getThreadSubtypeDisplayLabel,
  getThreadSubtype,
} from '../../utils/threadSubtype'
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
    const subtype = input.subtype
    const label =
      subtype === ThreadSubtype.CUSTOM
        ? (input.label ?? '').trim()
        : getThreadSubtypeDisplayLabel(subtype)
    const thread: Thread = {
      id: generateEntityId(EntityType.THREAD) as ThreadId,
      gameId: input.gameId,
      playthroughId: input.playthroughId ?? undefined,
      sourceId: input.sourceId,
      targetId: input.targetId,
      subtype,
      label,
      createdAt: now,
      ...(input.requirementAllowedStatuses != null && {
        requirementAllowedStatuses: input.requirementAllowedStatuses,
      }),
      ...(input.objectiveIndex != null && {
        objectiveIndex: input.objectiveIndex,
      }),
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

  async getThreadsFromEntity(
    gameId: GameId,
    entityId: string,
    playthroughId?: PlaythroughId | null
  ): Promise<Thread[]> {
    const threads = await this.getByGameId(gameId, playthroughId)
    return threads.filter(
      (t) => t.sourceId === entityId || t.targetId === entityId
    )
  }

  async deleteThreadsInvolvingEntity(
    gameId: GameId,
    entityId: string
  ): Promise<void> {
    const threads = await this.getThreadsFromEntity(gameId, entityId)
    await Promise.all(threads.map((t) => this.delete(t.id)))
  }

  async getRequirementThreadsFromEntity(
    gameId: GameId,
    entityId: string
  ): Promise<Thread[]> {
    const threads = await this.getByGameId(gameId, null)
    return threads.filter(
      (t) =>
        t.sourceId === entityId &&
        getThreadSubtype(t) === ThreadSubtype.REQUIRES
    )
  }
}

/** Single thread repository instance. */
export const threadRepository: IThreadRepository = new ThreadRepositoryImpl()
