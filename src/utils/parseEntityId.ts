import { EntityType } from '../types/EntityType'

/** Result of parsing a typed entity ID. */
export interface ParsedEntityId {
  /** Entity type from the prefix. */
  type: EntityType
  /** Raw UUID part after the separator. */
  rawId: string
}

/**
 * Parses a typed entity ID of the form `{entityType}:{uuid}`.
 *
 * @param id - Full entity ID (e.g. "3:a1b2c3d4-e5f6-7890-abcd-ef1234567890")
 * @returns Parsed type and raw ID, or null if invalid / legacy unprefixed ID
 */
export function parseEntityId(id: string): ParsedEntityId | null {
  if (!id || typeof id !== 'string') return null
  const idx = id.indexOf(':')
  if (idx <= 0) return null
  const typeNum = Number(id.slice(0, idx))
  const rawId = id.slice(idx + 1)
  if (rawId === '' || !Number.isInteger(typeNum)) return null
  if (typeNum < EntityType.QUEST || typeNum > EntityType.PATH) return null
  return { type: typeNum as EntityType, rawId }
}

/**
 * Returns the entity type from a typed entity ID, or null if invalid.
 *
 * @param id - Full entity ID
 * @returns EntityType or null
 */
export function getEntityTypeFromId(id: string): EntityType | null {
  const parsed = parseEntityId(id)
  return parsed?.type ?? null
}
