/**
 * Singleton quest repository for the app.
 * Use this instead of Dexie directly; implements IQuestRepository against IndexedDB.
 */

import type { Quest } from '../../types/Quest'
import type { QuestProgress } from '../../types/QuestProgress'
import { EntityType } from '../../types/EntityType'
import type { GameId, PlaythroughId, QuestId } from '../../types/ids'
import { generateId, generateEntityId } from '../../utils/generateId'
import { db, type QuestProgressRow } from '../db'
import { deleteThreadsForEntity } from './cascadeDeleteThreads'
import { mapMarkerRepository } from './MapMarkerRepository'
import type { CreateQuestInput } from './CreateQuestInput'
import type { IQuestRepository } from './IQuestRepository'

/**
 * Dexie-backed implementation of IQuestRepository.
 */
class QuestRepositoryImpl implements IQuestRepository {
  async getByGameId(gameId: GameId): Promise<Quest[]> {
    return db.quests.where('gameId').equals(gameId).toArray()
  }

  async getById(id: QuestId): Promise<Quest | undefined> {
    return db.quests.get(id)
  }

  async create(input: CreateQuestInput): Promise<Quest> {
    const now = new Date().toISOString()
    const quest: Quest = {
      id: generateEntityId(EntityType.QUEST) as QuestId,
      gameId: input.gameId,
      title: input.title,
      giver: input.giver,
      objectives: input.objectives ?? [],
      createdAt: now,
      updatedAt: now,
    }
    await db.quests.add(quest)
    return quest
  }

  async update(quest: Quest): Promise<void> {
    const updated: Quest = {
      ...quest,
      updatedAt: new Date().toISOString(),
    }
    await db.quests.put(updated)
  }

  async delete(id: QuestId): Promise<void> {
    const quest = await db.quests.get(id)
    if (quest) {
      await deleteThreadsForEntity(quest.gameId, id)
      await mapMarkerRepository.deleteByEntity(
        quest.gameId,
        EntityType.QUEST,
        id
      )
    }
    await db.quests.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.quests.where('gameId').equals(gameId).delete()
  }

  async getProgress(
    playthroughId: PlaythroughId,
    questId: QuestId
  ): Promise<QuestProgress | undefined> {
    const row = await db.questProgress
      .where('[playthroughId+questId]')
      .equals([playthroughId, questId])
      .first()
    return row ? toQuestProgress(row) : undefined
  }

  async getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<QuestProgress[]> {
    const rows = await db.questProgress
      .where('playthroughId')
      .equals(playthroughId)
      .toArray()
    return rows.map(toQuestProgress)
  }

  async upsertProgress(progress: QuestProgress): Promise<void> {
    const row: QuestProgressRow = {
      id: progress.id ?? generateId(),
      playthroughId: progress.playthroughId,
      questId: progress.questId,
      completedObjectiveIndexes: progress.completedObjectiveIndexes ?? [],
      status: progress.status,
      notes: progress.notes,
    }
    await db.questProgress.put(row)
  }

  async deleteProgressByPlaythroughId(
    playthroughId: PlaythroughId
  ): Promise<void> {
    await db.questProgress.where('playthroughId').equals(playthroughId).delete()
  }
}

/**
 * Convert a QuestProgressRow to a QuestProgress.
 *
 * @param row - The QuestProgressRow to convert.
 * @returns The QuestProgress.
 */
function toQuestProgress(row: QuestProgressRow): QuestProgress {
  return {
    id: row.id,
    playthroughId: row.playthroughId,
    questId: row.questId,
    completedObjectiveIndexes: row.completedObjectiveIndexes ?? [],
    status: row.status,
    notes: row.notes,
  }
}

/** Single quest repository instance. */
export const questRepository: IQuestRepository = new QuestRepositoryImpl()
