import type { GameId, PlaythroughId } from '../../types/ids'
import type { EntityType } from '../../types/EntityType'

/**
 * Input for creating a thread.
 * ID and createdAt are set by the repository.
 */
export interface CreateThreadInput {
  /** ID of the game this thread belongs to. */
  gameId: GameId
  /** When set, thread is playthrough-scoped (user investigation); when omitted, game-authored. */
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
  label?: string
}
