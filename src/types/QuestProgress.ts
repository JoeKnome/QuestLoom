import type { PlaythroughId, QuestId } from './ids'
import type { QuestStatus } from './enums'

/**
 * Quest progress (playthrough-scoped).
 * Tracks status and user notes for a quest in a specific playthrough.
 * Cleared on "new playthrough."
 *
 * @property id - Optional unique identifier (for Dexie primary key)
 * @property playthroughId - ID of the playthrough
 * @property questId - ID of the quest
 * @property status - Quest completion status
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
  /** Optional user notes. */
  notes: string
}
