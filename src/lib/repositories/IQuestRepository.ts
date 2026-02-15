import type { Quest } from '../../types/Quest'
import type { QuestProgress } from '../../types/QuestProgress'
import type { GameId, PlaythroughId, QuestId } from '../../types/ids'
import type { CreateQuestInput } from './CreateQuestInput'

/**
 * Contract for quest and quest progress data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IQuestRepository {
  /** 
   * Returns all quests for a game.
   * 
   * @param gameId - The ID of the game.
   * @returns All quests for the game.
   */
  getByGameId(gameId: GameId): Promise<Quest[]>

  /** 
   * Returns a quest by ID.
   * 
   * @param id - The ID of the quest.
   * @returns The quest, or undefined if not found.
   */
  getById(id: QuestId): Promise<Quest | undefined>

  /** 
   * Creates a quest; ID and timestamps are set by the repository.
   * 
   * @param input - The input to create the quest.
   * @returns The created quest.
   */
  create(input: CreateQuestInput): Promise<Quest>

  /** 
   * Updates an existing quest; updatedAt is set by the repository.
   * 
   * @param quest - The quest to update.
   */
  update(quest: Quest): Promise<void>

  /** 
   * Deletes a quest by ID.
   * 
   * @param id - The ID of the quest to delete.
   */
  delete(id: QuestId): Promise<void>

  /** 
   * Deletes all quests for a game (cascade when deleting game).
   * 
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /** 
   * Returns progress for a single quest in a playthrough, or undefined.
   * 
   * @param playthroughId - The playthrough ID.
   * @param questId - The ID of the quest.
   * @returns The progress for the quest, or undefined if not found.
   */
  getProgress(
    playthroughId: PlaythroughId,
    questId: QuestId
  ): Promise<QuestProgress | undefined>

  /** 
   * Returns all quest progress for a playthrough.
   * 
   * @param playthroughId - The playthrough ID.
   * @returns All quest progress for the playthrough.
   */
  getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<QuestProgress[]>

  /** 
   * Inserts or updates quest progress; id is generated if missing.
   * 
   * @param progress - The quest progress to upsert.
   */
  upsertProgress(progress: QuestProgress): Promise<void>

  /** 
   * Deletes all quest progress for a playthrough (cascade when deleting playthrough).
   * 
   * @param playthroughId - The playthrough ID.
   */
  deleteProgressByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
