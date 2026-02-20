/**
 * Singleton person repository for the app.
 * Use this instead of Dexie directly; implements IPersonRepository against IndexedDB.
 */

import type { Person } from '../../types/Person'
import type { PersonProgress } from '../../types/PersonProgress'
import { EntityType } from '../../types/EntityType'
import type { GameId, PersonId, PlaythroughId } from '../../types/ids'
import { generateId, generateEntityId } from '../../utils/generateId'
import { db, type PersonProgressRow } from '../db'
import { deleteThreadsForEntity } from './cascadeDeleteThreads'
import { mapMarkerRepository } from './MapMarkerRepository'
import type { CreatePersonInput } from './CreatePersonInput'
import type { IPersonRepository } from './IPersonRepository'

/**
 * Dexie-backed implementation of IPersonRepository.
 */
class PersonRepositoryImpl implements IPersonRepository {
  async getByGameId(gameId: GameId): Promise<Person[]> {
    return db.persons.where('gameId').equals(gameId).toArray()
  }

  async getById(id: PersonId): Promise<Person | undefined> {
    return db.persons.get(id)
  }

  async create(input: CreatePersonInput): Promise<Person> {
    const now = new Date().toISOString()
    const person: Person = {
      id: generateEntityId(EntityType.PERSON) as PersonId,
      gameId: input.gameId,
      name: input.name,
      notes: input.notes ?? '',
      createdAt: now,
      updatedAt: now,
    }
    await db.persons.add(person)
    return person
  }

  async update(person: Person): Promise<void> {
    const updated: Person = {
      ...person,
      updatedAt: new Date().toISOString(),
    }
    await db.persons.put(updated)
  }

  async delete(id: PersonId): Promise<void> {
    const person = await db.persons.get(id)
    if (person) {
      await deleteThreadsForEntity(person.gameId, id)
      await mapMarkerRepository.deleteByEntity(
        person.gameId,
        EntityType.PERSON,
        id
      )
    }
    await db.persons.delete(id)
  }

  async deleteByGameId(gameId: GameId): Promise<void> {
    await db.persons.where('gameId').equals(gameId).delete()
  }

  async getProgress(
    playthroughId: PlaythroughId,
    personId: PersonId
  ): Promise<PersonProgress | undefined> {
    const row = await db.personProgress
      .where('[playthroughId+personId]')
      .equals([playthroughId, personId])
      .first()
    return row ? toPersonProgress(row) : undefined
  }

  async getAllProgressForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<PersonProgress[]> {
    const rows = await db.personProgress
      .where('playthroughId')
      .equals(playthroughId)
      .toArray()
    return rows.map(toPersonProgress)
  }

  async upsertProgress(progress: PersonProgress): Promise<void> {
    let id = progress.id
    if (id === undefined) {
      const existing = await db.personProgress
        .where('[playthroughId+personId]')
        .equals([progress.playthroughId, progress.personId])
        .first()
      id = existing?.id ?? generateId()
    }
    const row: PersonProgressRow = {
      id,
      playthroughId: progress.playthroughId,
      personId: progress.personId,
      status: progress.status,
      notes: progress.notes,
    }
    await db.personProgress.put(row)
  }

  async deleteProgressByPlaythroughId(
    playthroughId: PlaythroughId
  ): Promise<void> {
    await db.personProgress
      .where('playthroughId')
      .equals(playthroughId)
      .delete()
  }
}

/**
 * Convert a PersonProgressRow to a PersonProgress.
 *
 * @param row - The PersonProgressRow to convert.
 * @returns The PersonProgress.
 */
function toPersonProgress(row: PersonProgressRow): PersonProgress {
  return {
    id: row.id,
    playthroughId: row.playthroughId,
    personId: row.personId,
    status: row.status,
    notes: row.notes,
  }
}

/** Single person repository instance. */
export const personRepository: IPersonRepository = new PersonRepositoryImpl()
