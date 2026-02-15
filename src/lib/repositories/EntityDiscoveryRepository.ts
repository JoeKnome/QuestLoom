/**
 * Singleton entity discovery repository for the app.
 * Use this instead of Dexie directly; implements IEntityDiscoveryRepository against IndexedDB.
 */

import type { EntityDiscovery } from '../../types/EntityDiscovery'
import type { DiscoveryEntityType } from '../../types/DiscoveryEntityType'
import type { PlaythroughId } from '../../types/ids'
import { generateId } from '../../utils/generateId'
import { db, type EntityDiscoveryRow } from '../db'
import type { IEntityDiscoveryRepository } from './IEntityDiscoveryRepository'

/**
 * Dexie-backed implementation of IEntityDiscoveryRepository.
 */
class EntityDiscoveryRepositoryImpl implements IEntityDiscoveryRepository {
  async getDiscovery(
    playthroughId: PlaythroughId,
    entityType: DiscoveryEntityType,
    entityId: string
  ): Promise<EntityDiscovery | undefined> {
    const row = await db.entityDiscovery
      .where('[playthroughId+entityType+entityId]')
      .equals([playthroughId, entityType, entityId])
      .first()
    return row ? toEntityDiscovery(row) : undefined
  }

  async getAllForPlaythrough(
    playthroughId: PlaythroughId
  ): Promise<EntityDiscovery[]> {
    const rows = await db.entityDiscovery
      .where('playthroughId')
      .equals(playthroughId)
      .toArray()
    return rows.map(toEntityDiscovery)
  }

  async upsert(discovery: EntityDiscovery): Promise<void> {
    const row: EntityDiscoveryRow = {
      id: discovery.id ?? generateId(),
      playthroughId: discovery.playthroughId,
      entityType: discovery.entityType,
      entityId: discovery.entityId,
      discovered: discovery.discovered,
    }
    await db.entityDiscovery.put(row)
  }

  async deleteByPlaythroughId(playthroughId: PlaythroughId): Promise<void> {
    await db.entityDiscovery
      .where('playthroughId')
      .equals(playthroughId)
      .delete()
  }
}

/**
 * Convert a EntityDiscoveryRow to an EntityDiscovery.
 * 
 * @param row - The EntityDiscoveryRow to convert.
 * @returns The EntityDiscovery.
 */
function toEntityDiscovery(row: EntityDiscoveryRow): EntityDiscovery {
  return {
    id: row.id,
    playthroughId: row.playthroughId,
    entityType: row.entityType,
    entityId: row.entityId,
    discovered: row.discovered,
  }
}

/** Single entity discovery repository instance. */
export const entityDiscoveryRepository: IEntityDiscoveryRepository =
  new EntityDiscoveryRepositoryImpl()
