import type { GameId } from '../../types/ids'

/**
 * Input for creating an insight.
 * ID and timestamps are set by the repository.
 */
export interface CreateInsightInput {
  /** ID of the game this insight belongs to. */
  gameId: GameId
  /** Short label. */
  title: string
  /** Full insight text (key info, lore, or description). */
  content: string
}
