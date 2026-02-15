import type { GameId, PlaceId } from '../../types/ids'

/**
 * Input for creating an item.
 * ID and timestamps are set by the repository.
 */
export interface CreateItemInput {
  /** ID of the game this item belongs to. */
  gameId: GameId
  /** Item name. */
  name: string
  /** ID of the place where the item is acquired. */
  location: PlaceId
  /** Optional description. */
  description?: string
}
