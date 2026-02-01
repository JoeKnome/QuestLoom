import type { GameId, InsightId } from './ids'

/**
 * Insight definition (game-scoped).
 * Progress (status, notes) lives in InsightProgress per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this insight belongs to
 * @property title - Short label
 * @property content - Full insight text (key info, lore, or description)
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Insight {
  /** Unique identifier. */
  id: InsightId
  /** ID of the game this insight belongs to. */
  gameId: GameId
  /** Short label. */
  title: string
  /** Full insight text (key info, lore, or description). */
  content: string
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
