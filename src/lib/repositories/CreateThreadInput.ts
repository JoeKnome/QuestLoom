import type { GameId, PlaythroughId } from '../../types/ids'

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
  /** Optional relationship label. */
  label?: string
}
