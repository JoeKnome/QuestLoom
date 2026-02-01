/**
 * Optional sub-objective within a quest definition.
 *
 * @property label - Short description of the objective
 * @property completed - Whether the objective is completed (playthrough state would live in progress)
 */
export interface QuestObjective {
  /** Short description of the objective. */
  label: string
  /** Whether the objective is completed. */
  completed: boolean
}
