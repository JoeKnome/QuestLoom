import type { GameId, PlaythroughId } from '../../types/ids'
import type { ThreadSubtype } from '../../types/ThreadSubtype'

/**
 * Input for creating a thread.
 * ID and createdAt are set by the repository.
 * sourceId and targetId must be typed entity IDs (format type:uuid).
 */
export interface CreateThreadInput {
  /** ID of the game this thread belongs to. */
  gameId: GameId

  /** When set, thread is playthrough-scoped (user investigation); when omitted, game-authored. */
  playthroughId?: PlaythroughId | null

  /** Typed ID of the source entity. */
  sourceId: string

  /** Typed ID of the target entity. */
  targetId: string

  /** Relationship subtype. */
  subtype: ThreadSubtype

  /** Custom label when subtype is Custom; ignored for reserved subtypes (display label set from subtype). */
  label?: string

  /**
   * For Requires and ObjectiveRequires: set of status enum values (target entity type) that satisfy the requirement. Omit for default.
   */
  requirementAllowedStatuses?: number[]

  /**
   * For ObjectiveRequires: 0-based index of the quest objective this dependency belongs to.
   */
  objectiveIndex?: number
}
