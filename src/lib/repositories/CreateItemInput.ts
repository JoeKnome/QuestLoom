import type { GameId } from '../../types/ids'

/**
 * Input for creating an item.
 * ID and timestamps are set by the repository.
 */
export interface CreateItemInput {
  /** ID of the game this item belongs to. */
  gameId: GameId
  /** Item name. */
  name: string
  /** Optional description. */
  description?: string
}
