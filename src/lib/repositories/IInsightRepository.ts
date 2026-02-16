import type { Insight } from '../../types/Insight'
import type { InsightProgress } from '../../types/InsightProgress'
import type { GameId, InsightId, PlaythroughId } from '../../types/ids'
import type { CreateInsightInput } from './CreateInsightInput'

/**
 * Contract for insight and insight progress data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IInsightRepository {
  /**
   * Returns all insights for a game.
   *
   * @param gameId - The game ID.
   * @returns All insights for the game.
   */
  getByGameId(gameId: GameId): Promise<Insight[]>

  /**
   * Returns an insight by ID.
   *
   * @param id - The ID of the insight.
   * @returns The insight, or undefined if not found.
   */
  getById(id: InsightId): Promise<Insight | undefined>

  /**
   * Creates an insight; ID and timestamps are set by the repository.
   *
   * @param input - The input to create the insight.
   * @returns The created insight.
   */
  create(input: CreateInsightInput): Promise<Insight>

  /**
   * Updates an existing insight; updatedAt is set by the repository.
   *
   * @param insight - The insight to update.
   */
  update(insight: Insight): Promise<void>

  /**
   * Deletes an insight by ID.
   *
   * @param id - The ID of the insight to delete.
   */
  delete(id: InsightId): Promise<void>

  /**
   * Deletes all insights for a game (cascade when deleting game).
   *
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /**
   * Returns progress for a single insight in a playthrough, or undefined.
   *
   * @param playthroughId - The playthrough ID.
   * @param insightId - The ID of the insight.
   * @returns The progress for the insight, or undefined if not found.
   */
  getProgress(
    playthroughId: PlaythroughId,
    insightId: InsightId
  ): Promise<InsightProgress | undefined>

  /**
   * Returns all insight progress for a playthrough.
   *
   * @param playthroughId - The playthrough ID.
   * @returns All insight progress for the playthrough.
   */
  getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<InsightProgress[]>

  /**
   * Inserts or updates insight progress; id is generated if missing.
   *
   * @param progress - The insight progress to upsert.
   */
  upsertProgress(progress: InsightProgress): Promise<void>

  /**
   * Deletes all insight progress for a playthrough (cascade when deleting playthrough).
   *
   * @param playthroughId - The playthrough ID.
   */
  deleteProgressByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
