import type { GameId, PlaythroughId, ThreadId } from './ids'
import type { EntityType } from './EntityType'

/**
 * Thread: a link between two entities (game-scoped or playthrough-scoped).
 * When playthroughId is set, this is a user-created investigation (cleared on new playthrough).
 * When playthroughId is null/undefined, this is game-authored (survives "clear progress").
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this thread belongs to
 * @property playthroughId - Optional; when set, thread is playthrough-scoped (user investigation)
 * @property sourceId - ID of the source entity
 * @property sourceType - Type of the source entity
 * @property targetId - ID of the target entity
 * @property targetType - Type of the target entity
 * @property label - Optional relationship label
 * @property createdAt - Creation timestamp (ISO 8601)
 */
export interface Thread {
  /** Unique identifier. */
  id: ThreadId
  /** ID of the game this thread belongs to. */
  gameId: GameId
  /** When set, thread is playthrough-scoped (user investigation); when null, game-authored. */
  playthroughId?: PlaythroughId | null
  /** ID of the source entity. */
  sourceId: string
  /** Type of the source entity. */
  sourceType: EntityType
  /** ID of the target entity. */
  targetId: string
  /** Type of the target entity. */
  targetType: EntityType
  /** Optional relationship label. */
  label: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
}
