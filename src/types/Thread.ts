import type { GameId, PlaythroughId, ThreadId } from './ids'
import type { ThreadSubtype } from './ThreadSubtype'

/**
 * Thread: a link between two entities (game-scoped or playthrough-scoped).
 * When playthroughId is set, this is a user-created investigation (cleared on new playthrough).
 * When playthroughId is null/undefined, this is game-authored (survives "clear progress").
 * Source and target IDs are typed entity IDs (format type:uuid); entity type is derived via parseEntityId.
 * Subtype determines relationship kind and is used for logic; label is for display only.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this thread belongs to
 * @property playthroughId - Optional; when set, thread is playthrough-scoped (user investigation)
 * @property sourceId - Typed ID of the source entity
 * @property targetId - Typed ID of the target entity
 * @property subtype - Relationship subtype (use for logic and filtering).
 * @property label - Display label: canonical for reserved subtypes, user text for Custom.
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property requirementAllowedStatuses - For Requires and ObjectiveRequires: allowed status enum values for target. If absent, default for target type is used.
 * @property objectiveIndex - For ObjectiveRequires: 0-based index of the quest objective this dependency belongs to.
 */
export interface Thread {
  /** Unique identifier. */
  id: ThreadId

  /** ID of the game this thread belongs to. */
  gameId: GameId

  /** When set, thread is playthrough-scoped (user investigation); when null, game-authored. */
  playthroughId?: PlaythroughId | null

  /** Typed ID of the source entity (entity type derivable via parseEntityId). */
  sourceId: string

  /** Typed ID of the target entity (entity type derivable via parseEntityId). */
  targetId: string

  /** Relationship subtype (use for logic and filtering). */
  subtype: ThreadSubtype

  /** Display label: canonical for reserved subtypes, user text for Custom. */
  label: string

  /** Creation timestamp (ISO 8601). */
  createdAt: string

  /**
   * For Requires and ObjectiveRequires: set of status enum values (target entity type)
   * that satisfy the requirement. If absent or empty, default for target type is used.
   */
  requirementAllowedStatuses?: number[]

  /**
   * For ObjectiveRequires: 0-based index of the quest objective (of the source quest) this dependency belongs to.
   */
  objectiveIndex?: number
}
