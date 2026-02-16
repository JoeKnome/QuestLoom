/**
 * Complete set of entity types for display and game-view sections.
 * Covers all seven section types: quest, insight, item, person, place, map, thread.
 * Subsets (e.g. types that can be thread source/target) are defined separately where needed.
 * Aligned with docs/data-models.md.
 */
export enum EntityType {
  QUEST = 0,
  INSIGHT = 1,
  ITEM = 2,
  PERSON = 3,
  PLACE = 4,
  MAP = 5,
  THREAD = 6,
}

/**
 * Entity types that can be source or target of a thread.
 * Excludes MAP and THREAD because threads link only quests, insights, items, people, and places.
 * Use this constant wherever the UI restricts to these five types (e.g. ThreadForm, EntityPicker for thread endpoints).
 */
export const THREAD_ENDPOINT_ENTITY_TYPES: readonly EntityType[] = [
  EntityType.QUEST,
  EntityType.INSIGHT,
  EntityType.ITEM,
  EntityType.PERSON,
  EntityType.PLACE,
]
