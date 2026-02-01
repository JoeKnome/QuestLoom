import type { GameId, QuestId } from './ids'
import type { QuestObjective } from './enums'

/**
 * Quest definition (game-scoped).
 * Progress (status, notes) lives in QuestProgress per playthrough.
 *
 * @property id - Unique identifier
 * @property gameId - ID of the game this quest belongs to
 * @property title - Quest name
 * @property giver - ID of the entity that gave the quest (e.g. person, place)
 * @property objectives - Optional sub-objectives
 * @property createdAt - Creation timestamp (ISO 8601)
 * @property updatedAt - Last update timestamp (ISO 8601)
 */
export interface Quest {
  /** Unique identifier. */
  id: QuestId
  /** ID of the game this quest belongs to. */
  gameId: GameId
  /** Quest name. */
  title: string
  /** ID of the entity that gave the quest (e.g. person, place). */
  giver: string
  /** Optional sub-objectives. */
  objectives: QuestObjective[]
  /** Creation timestamp (ISO 8601). */
  createdAt: string
  /** Last update timestamp (ISO 8601). */
  updatedAt: string
}
