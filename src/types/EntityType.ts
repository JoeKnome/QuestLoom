/**
 * Complete set of entity types for display and game-view sections.
 * Covers quest, insight, item, person, place, map, thread, path.
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
  PATH = 7,
}

/**
 * Entity types that can be source or target of a thread.
 * Excludes MAP and THREAD; includes PATH (Place–Path and Path–Place links).
 * Use this constant wherever the UI restricts to these types (e.g. ThreadForm, EntityPicker for thread endpoints).
 */
export const THREAD_ENDPOINT_ENTITY_TYPES: readonly EntityType[] = [
  EntityType.QUEST,
  EntityType.INSIGHT,
  EntityType.ITEM,
  EntityType.PERSON,
  EntityType.PLACE,
  EntityType.PATH,
]

/**
 * Entity types that can be the target of an entity-level requirement (thread subtype Requires).
 * Excludes PLACE per data-models: "Place: not used for requirement targets in Phase 5.2."
 * Use in RequirementForm and anywhere that picks a requirement target.
 */
export const REQUIREMENT_TARGET_ENTITY_TYPES: readonly EntityType[] = [
  EntityType.QUEST,
  EntityType.INSIGHT,
  EntityType.ITEM,
  EntityType.PERSON,
]
