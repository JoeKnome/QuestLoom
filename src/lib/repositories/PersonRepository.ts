/**
 * Singleton person repository for the app.
 * Use this instead of Dexie directly; implements IPersonRepository against IndexedDB.
 */

import type { Person } from '../../types/Person'
import { EntityType } from '../../types/EntityType'
import type { GameId, PersonId } from '../../types/ids'
import { generateEntityId } from '../../utils/generateId'
import { db } from '../db'
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
}

/** Single person repository instance. */
export const personRepository: IPersonRepository = new PersonRepositoryImpl()
