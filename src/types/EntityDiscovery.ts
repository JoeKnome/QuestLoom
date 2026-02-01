import type { PlaythroughId } from './ids'
import type { DiscoveryEntityType } from './enums'

/**
 * Entity discovery state (playthrough-scoped).
 * Tracks whether a person, place, or map has been discovered in this playthrough.
 * Used for spoiler-friendly hiding; undiscovered entities can be hidden or greyed out.
 * Cleared on "new playthrough."
 *
 * @property id - Optional unique identifier (for Dexie primary key)
 * @property playthroughId - ID of the playthrough
 * @property entityType - Type of entity (person, place, map)
 * @property entityId - ID of the person, place, or map
 * @property discovered - Whether the entity has been discovered in this playthrough
 */
export interface EntityDiscovery {
  /** Optional unique identifier (for Dexie primary key). */
  id?: string
  /** ID of the playthrough. */
  playthroughId: PlaythroughId
  /** Type of entity (person, place, map). */
  entityType: DiscoveryEntityType
  /** ID of the person, place, or map. */
  entityId: string
  /** Whether the entity has been discovered in this playthrough. */
  discovered: boolean
}
