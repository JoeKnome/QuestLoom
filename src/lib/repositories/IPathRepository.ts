import type { Path } from '../../types/Path'
import type { PathProgress } from '../../types/PathProgress'
import type { GameId, PathId, PlaythroughId } from '../../types/ids'
import type { CreatePathInput } from './CreatePathInput'

/**
 * Contract for path and path progress data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IPathRepository {
  /**
   * Returns all paths for a game.
   *
   * @param gameId - The ID of the game.
   * @returns All paths for the game.
   */
  getByGameId(gameId: GameId): Promise<Path[]>

  /**
   * Returns a path by ID.
   *
   * @param id - The ID of the path.
   * @returns The path, or undefined if not found.
   */
  getById(id: PathId): Promise<Path | undefined>

  /**
   * Creates a path; ID and timestamps are set by the repository.
   *
   * @param input - The input to create the path.
   * @returns The created path.
   */
  create(input: CreatePathInput): Promise<Path>

  /**
   * Updates an existing path; updatedAt is set by the repository.
   *
   * @param path - The path to update.
   */
  update(path: Path): Promise<void>

  /**
   * Deletes a path by ID.
   *
   * @param id - The ID of the path to delete.
   */
  delete(id: PathId): Promise<void>

  /**
   * Deletes all paths for a game (cascade when deleting game).
   *
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /**
   * Returns traversal progress for a single path in a playthrough, or undefined.
   *
   * @param playthroughId - The playthrough ID.
   * @param pathId - The ID of the path.
   * @returns The progress for the path, or undefined if not found.
   */
  getProgress(
    playthroughId: PlaythroughId,
    pathId: PathId
  ): Promise<PathProgress | undefined>

  /**
   * Returns all path progress rows for a playthrough.
   *
   * @param playthroughId - The playthrough ID.
   * @returns All path progress rows for the playthrough.
   */
  getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<PathProgress[]>

  /**
   * Inserts or updates path progress; id is generated or reused for the
   * (playthroughId, pathId) pair.
   *
   * @param progress - The path progress to upsert.
   */
  upsertProgress(progress: PathProgress): Promise<void>

  /**
   * Deletes all path progress for a playthrough (cascade when deleting playthrough).
   *
   * @param playthroughId - The playthrough ID.
   */
  deleteProgressByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
