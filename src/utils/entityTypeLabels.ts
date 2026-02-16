import { EntityType } from '../types/EntityType'

/**
 * Human-readable singular labels for each entity type (e.g. "Quest", "Person").
 * Used in forms, pickers, and anywhere a single-entity label is needed.
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.QUEST]: 'Quest',
  [EntityType.INSIGHT]: 'Insight',
  [EntityType.ITEM]: 'Item',
  [EntityType.PERSON]: 'Person',
  [EntityType.PLACE]: 'Place',
  [EntityType.MAP]: 'Map',
  [EntityType.THREAD]: 'Thread',
}

/**
 * Human-readable plural labels for each entity type (e.g. "Quests", "People").
 * Used in section headers, sidebars, and list titles.
 */
export const ENTITY_TYPE_PLURAL_LABELS: Record<EntityType, string> = {
  [EntityType.QUEST]: 'Quests',
  [EntityType.INSIGHT]: 'Insights',
  [EntityType.ITEM]: 'Items',
  [EntityType.PERSON]: 'People',
  [EntityType.PLACE]: 'Places',
  [EntityType.MAP]: 'Maps',
  [EntityType.THREAD]: 'Threads',
}
