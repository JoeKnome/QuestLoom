import type { GameId, ItemId, PlaceId } from './ids'

/**
 * Item definition (game-scoped).
 * State (status, notes) lives in ItemState per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this item belongs to
 * @property name - Item name
 * @property location - ID of the place where the item is acquired
 * @property description - Optional description
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Item {
  /** Unique identifier. */
  id: ItemId
  /** ID of the game this item belongs to. */
  gameId: GameId
  /** Item name. */
  name: string
  /** ID of the place where the item is acquired. */
  location: PlaceId
  /** Optional description. */
  description: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
