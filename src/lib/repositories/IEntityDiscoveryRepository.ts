import type { EntityDiscovery } from '../../types/EntityDiscovery'
import type { DiscoveryEntityType } from '../../types/DiscoveryEntityType'
import type { PlaythroughId } from '../../types/ids'

/**
 * Contract for entity discovery state (playthrough-scoped).
 * Feature code depends on this interface; swap implementations to use API instead of Dexie.
 */
export interface IEntityDiscoveryRepository {
  /** 
   * Returns discovery for a single entity in a playthrough, or undefined.
   * 
   * @param playthroughId - The playthrough ID.
   * @param entityType - The type of entity.
   * @param entityId - The ID of the entity.
   * @returns The discovery for the entity, or undefined if not found.
   */
  getDiscovery(
    playthroughId: PlaythroughId,
    entityType: DiscoveryEntityType,
    entityId: string
  ): Promise<EntityDiscovery | undefined>

  /** 
   * Returns all discovery records for a playthrough.
   * 
   * @param playthroughId - The playthrough ID.
   * @returns All discovery records for the playthrough.
   */
  getAllForPlaythrough(playthroughId: PlaythroughId): Promise<EntityDiscovery[]>

  /** 
   * Inserts or updates a discovery record; id is generated if missing.
   * 
   * @param discovery - The discovery record to upsert.
   */
  upsert(discovery: EntityDiscovery): Promise<void>

  /** 
   * Deletes all discovery records for a playthrough (cascade when deleting playthrough).
   * 
   * @param playthroughId - The playthrough ID.
   */
  deleteByPlaythroughId(playthroughId: PlaythroughId): Promise<void>
}
