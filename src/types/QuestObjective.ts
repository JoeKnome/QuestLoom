/**
 * Optional sub-objective within a quest definition.
 * Completability can be derived from an entity's status; completion itself is
 * tracked per playthrough (in quest progress), not on the quest definition.
 *
 * @property label - Short description of the objective
 * @property entityId - Optional typed entity ID; when set, completability is derived when that entity's status is in allowedStatuses
 * @property allowedStatuses - Optional set of status enum values for entityId's type; if absent, default for that type is used
 */
export interface QuestObjective {
  /** Short description of the objective. */
  label: string
  /**
   * Optional typed entity ID. When set, the objective is *completable* when this entity's
   * playthrough status is in allowedStatuses (or type default). Completion remains manual
   * and is stored per playthrough, not on the quest.
   */
  entityId?: string
  /**
   * Optional set of status enum values (for entityId's type) that make the objective completable.
   * If absent or empty, default for that entity type is used.
   */
  allowedStatuses?: number[]
}
