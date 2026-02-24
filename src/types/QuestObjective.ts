/**
 * Optional sub-objective within a quest definition.
 * Completion is manual (checkbox); completability can be derived from an entity's status.
 *
 * @property label - Short description of the objective
 * @property completed - Whether the objective is completed (manual user action; stored)
 * @property entityId - Optional typed entity ID; when set, completability is derived when that entity's status is in allowedStatuses
 * @property allowedStatuses - Optional set of status enum values for entityId's type; if absent, default for that type is used
 */
export interface QuestObjective {
  /** Short description of the objective. */
  label: string
  /** Whether the objective is completed (user marks done via checkbox). */
  completed: boolean
  /**
   * Optional typed entity ID. When set, the objective is *completable* when this entity's
   * playthrough status is in allowedStatuses (or type default). Completion remains manual.
   */
  entityId?: string
  /**
   * Optional set of status enum values (for entityId's type) that make the objective completable.
   * If absent or empty, default for that entity type is used.
   */
  allowedStatuses?: number[]
}
