import { EntityType } from '../types/EntityType'

/**
 * Generates a new unique identifier (raw UUID).
 * Use for non-entity rows (e.g. progress, state, discovery).
 *
 * @returns A new UUID string
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Generates a new entity ID with type prefix: `{entityType}:{uuid}`.
 * Use for all entities (quest, insight, item, person, place, map, thread).
 *
 * @param entityType - EntityType enum value.
 * @returns A typed entity ID string.
 */
export function generateEntityId(entityType: EntityType): string {
  return `${entityType}:${crypto.randomUUID()}`
}
