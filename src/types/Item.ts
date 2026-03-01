import type { GameId, ItemId } from './ids'

/**
 * Item definition (game-scoped).
 * State (status, notes) lives in ItemState per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this item belongs to
 * @property name - Item name
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
  /** Optional description. */
  description: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
