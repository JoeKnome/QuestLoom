import type { PathId, PlaythroughId } from './ids'
import type { PathStatus } from './PathStatus'

/**
 * Path progress (playthrough-scoped).
 * Tracks traversal status of a path in a specific playthrough.
 * Cleared on "new playthrough."
 */
export interface PathProgress {
  /** Optional unique identifier (for Dexie primary key). */
  id?: string

  /** ID of the playthrough. */
  playthroughId: PlaythroughId

  /** ID of the path. */
  pathId: PathId

  /** Path traversal status. */
  status: PathStatus
}
