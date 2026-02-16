/**
 * Singleton insight repository for the app.
 * Use this instead of Dexie directly; implements IInsightRepository against IndexedDB.
 */

import type { Insight } from '../../types/Insight'
import type { InsightProgress } from '../../types/InsightProgress'
import { EntityType } from '../../types/EntityType'
import type { GameId, InsightId, PlaythroughId } from '../../types/ids'
import { generateId, generateEntityId } from '../../utils/generateId'
import { db, type InsightProgressRow } from '../db'
import { deleteThreadsForEntity } from './cascadeDeleteThreads'
import type { CreateInsightInput } from './CreateInsightInput'
import type { IInsightRepository } from './IInsightRepository'

/**
 * Dexie-backed implementation of IInsightRepository.
 */
class InsightRepositoryImpl implements IInsightRepository {
  async getByGameId(gameId: GameId): Promise<Insight[]> {
    return db.insights.where('gameId').equals(gameId).toArray()
  }

  async getById(id: InsightId): Promise<Insight | undefined> {
    return db.insights.get(id)
  }

  async create(input: CreateInsightInput): Promise<Insight> {
    const now = new Date().toISOString()
    const insight: Insight = {
      id: generateEntityId(EntityType.INSIGHT) as InsightId,
      gameId: input.gameId,
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now,
    }
    await db.insights.add(insight)
    return insight
  }

  async update(insight: Insight): Promise<void> {
    const updated: Insight = {
      ...insight,
      updatedAt: new Date().toISOString(),
    }
    await db.insights.put(updated)
  }

  async delete(id: InsightId): Promise<void> {
    const insight = await db.insights.get(id)
    if (insight) {
      await deleteThreadsForEntity(insight.gameId, id)
    }
    await db.insights.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.insights.where('gameId').equals(gameId).delete()
  }

  async getProgress(
    playthroughId: PlaythroughId,
    insightId: InsightId
  ): Promise<InsightProgress | undefined> {
    const row = await db.insightProgress
      .where('[playthroughId+insightId]')
      .equals([playthroughId, insightId])
      .first()
    return row ? toInsightProgress(row) : undefined
  }

  async getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<InsightProgress[]> {
    const rows = await db.insightProgress
      .where('playthroughId')
      .equals(playthroughId)
      .toArray()
    return rows.map(toInsightProgress)
  }

  async upsertProgress(progress: InsightProgress): Promise<void> {
    const row: InsightProgressRow = {
      id: progress.id ?? generateId(),
      playthroughId: progress.playthroughId,
      insightId: progress.insightId,
      status: progress.status,
      notes: progress.notes,
    }
    await db.insightProgress.put(row)
  }

  async deleteProgressByPlaythroughId(
    playthroughId: PlaythroughId
  ): Promise<void> {
    await db.insightProgress
      .where('playthroughId')
      .equals(playthroughId)
      .delete()
  }
}

/**
 * Convert a InsightProgressRow to an InsightProgress.
 *
 * @param row - The InsightProgressRow to convert.
 * @returns The InsightProgress.
 */
function toInsightProgress(row: InsightProgressRow): InsightProgress {
  return {
    id: row.id,
    playthroughId: row.playthroughId,
    insightId: row.insightId,
    status: row.status,
    notes: row.notes,
  }
}

/** Single insight repository instance. */
export const insightRepository: IInsightRepository = new InsightRepositoryImpl()
