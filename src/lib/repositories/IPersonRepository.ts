import type { Person } from '../../types/Person'
import type { PersonProgress } from '../../types/PersonProgress'
import type { GameId, PersonId, PlaythroughId } from '../../types/ids'
import type { CreatePersonInput } from './CreatePersonInput'

/**
 * Contract for person data access.
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IPersonRepository {
  /**
   * Returns all persons for a game.
   *
   * @param gameId - The ID of the game.
   * @returns All persons for the game.
   */
  getByGameId(gameId: GameId): Promise<Person[]>

  /**
   * Returns a person by ID.
   *
   * @param id - The ID of the person.
   * @returns The person, or undefined if not found.
   */
  getById(id: PersonId): Promise<Person | undefined>

  /**
   * Creates a person; ID and timestamps are set by the repository.
   *
   * @param input - The input to create the person.
   * @returns The created person.
   */
  create(input: CreatePersonInput): Promise<Person>

  /**
   * Updates an existing person; updatedAt is set by the repository.
   *
   * @param person - The person to update.
   */
  update(person: Person): Promise<void>

  /**
   * Deletes a person by ID.
   *
   * @param id - The ID of the person to delete.
   */
  delete(id: PersonId): Promise<void>

  /**
   * Deletes all persons for a game (cascade when deleting game).
   *
   * @param gameId - The ID of the game to delete.
   */
  deleteByGameId(gameId: GameId): Promise<void>

  /**
   * Returns progress for a person in a playthrough.
   *
   * @param playthroughId - The playthrough ID.
   * @param personId - The person ID.
   * @returns The progress, or undefined if none.
   */
  getProgress(
    playthroughId: PlaythroughId,
    personId: PersonId
  ): Promise<PersonProgress | undefined>

  /**
   * Returns all person progress for a playthrough.
   *
   * @param playthroughId - The playthrough ID.
   * @returns All person progress for the playthrough.
   */
  getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<PersonProgress[]>

  /**
   * Creates or updates person progress.
   *
   * @param progress - The progress to upsert.
   */
  upsertProgress(progress: PersonProgress): Promise<void>

  /**
   * Deletes all person progress for a playthrough (cascade when deleting playthrough).
   *
   * @param playthroughId - The playthrough ID.
   */
  deleteProgressByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
