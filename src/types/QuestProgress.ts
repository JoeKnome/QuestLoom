import type { PlaythroughId, QuestId } from './ids'
import type { QuestStatus } from './QuestStatus'

/**
 * Quest progress (playthrough-scoped).
 * Tracks status, objective completion, and user notes for a quest in a
 * specific playthrough.
 * Cleared on "new playthrough."
 *
 * @property id - Optional unique identifier (for Dexie primary key)
 * @property playthroughId - ID of the playthrough
 * @property questId - ID of the quest
 * @property status - Quest completion status
 * @property completedObjectiveIndexes - Indexes of objectives completed in this playthrough
 * @property notes - Optional user notes
 */
export interface QuestProgress {
  /** Optional unique identifier (for Dexie primary key). */
  id?: string
  /** ID of the playthrough. */
  playthroughId: PlaythroughId
  /** ID of the quest. */
  questId: QuestId
  /** Quest completion status. */
  status: QuestStatus
  /**
   * Indexes of objectives completed in this playthrough.
   * Each index corresponds to an entry in the quest's objectives array.
   */
  completedObjectiveIndexes: number[]
  /** Optional user notes. */
  notes: string
}
