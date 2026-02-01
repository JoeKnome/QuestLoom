import type { InsightId, PlaythroughId } from './ids'
import type { InsightStatus } from './enums'

/**
 * Insight progress (playthrough-scoped).
 * Tracks status and user notes for an insight in a specific playthrough.
 * Cleared on "new playthrough."
 *
 * @property id - Optional unique identifier (for Dexie primary key)
 * @property playthroughId - ID of the playthrough
 * @property insightId - ID of the insight
 * @property status - Insight resolution status
 * @property notes - Optional user notes
 */
export interface InsightProgress {
  /** Optional unique identifier (for Dexie primary key). */
  id?: string
  /** ID of the playthrough. */
  playthroughId: PlaythroughId
  /** ID of the insight. */
  insightId: InsightId
  /** Insight resolution status. */
  status: InsightStatus
  /** Optional user notes. */
  notes: string
}
