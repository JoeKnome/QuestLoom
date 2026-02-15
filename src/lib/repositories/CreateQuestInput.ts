import type { GameId } from '../../types/ids'
import type { QuestObjective } from '../../types/QuestObjective'

/**
 * Input for creating a quest.
 * ID and timestamps are set by the repository.
 */
export interface CreateQuestInput {
  /** ID of the game this quest belongs to. */
  gameId: GameId
  /** Quest name. */
  title: string
  /** ID of the entity that gave the quest (e.g. person, place). */
  giver: string
  /** Optional sub-objectives. */
  objectives?: QuestObjective[]
}
