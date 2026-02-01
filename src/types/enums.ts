/**
 * Shared enums and union types for entity status and entity-type discrimination.
 * Aligned with docs/data-models.md.
 */

/** Quest completion status (playthrough-scoped). */
export type QuestStatus = 'active' | 'completed' | 'blocked'

/** Insight resolution status (playthrough-scoped). */
export type InsightStatus = 'active' | 'resolved' | 'irrelevant'

/** Item possession/state (playthrough-scoped). */
export type ItemStatus = 'possessed' | 'used' | 'lost' | 'other'

/** Entity type for thread source/target (quest, insight, item, person, place). */
export type EntityType = 'quest' | 'insight' | 'item' | 'person' | 'place'

/** Entity types that support discovery state (person, place, map). */
export type DiscoveryEntityType = 'person' | 'place' | 'map'

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
