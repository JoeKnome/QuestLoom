import type { ItemId, PlaythroughId } from './ids'
import type { ItemStatus } from './enums'

/**
 * Item state (playthrough-scoped).
 * Tracks possession/state and user notes for an item in a specific playthrough.
 * Cleared on "new playthrough."
 *
 * @property id - Optional unique identifier (for Dexie primary key)
 * @property playthroughId - ID of the playthrough
 * @property itemId - ID of the item
 * @property status - Item possession/state
 * @property notes - Optional user notes
 */
export interface ItemState {
  /** Optional unique identifier (for Dexie primary key). */
  id?: string
  /** ID of the playthrough. */
  playthroughId: PlaythroughId
  /** ID of the item. */
  itemId: ItemId
  /** Item possession/state. */
  status: ItemStatus
  /** Optional user notes. */
  notes: string
}
