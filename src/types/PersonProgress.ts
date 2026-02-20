import type { PlaythroughId, PersonId } from './ids'
import type { PersonStatus } from './PersonStatus'

/**
 * Person progress (playthrough-scoped).
 * Tracks status and user notes for a person in a specific playthrough.
 * Cleared on "new playthrough."
 *
 * @property id - Optional unique identifier (for Dexie primary key)
 * @property playthroughId - ID of the playthrough
 * @property personId - ID of the person
 * @property status - Person status (alive/dead/unknown)
 * @property notes - Optional user notes
 */
export interface PersonProgress {
  /** Optional unique identifier (for Dexie primary key). */
  id?: string
  /** ID of the playthrough. */
  playthroughId: PlaythroughId
  /** ID of the person. */
  personId: PersonId
  /** Person status. */
  status: PersonStatus
  /** Optional user notes. */
  notes: string
}
