import {
  insightRepository,
  itemRepository,
  mapRepository,
  pathRepository,
  personRepository,
  placeRepository,
  questRepository,
} from '../lib/repositories'
import { EntityType } from '../types/EntityType'
import { parseEntityId } from './parseEntityId'

/**
 * Fetches the display name for an entity by its typed ID (format type:uuid).
 * Parses the ID to determine type and performs a single repository lookup.
 * Use when the reference is polymorphic (e.g. quest giver) or when you only have the ID.
 *
 * @param entityId - Typed entity ID (e.g. "3:uuid" for a person)
 * @returns The display label, or the id if not found; empty string for empty/invalid id
 */
export async function getEntityDisplayName(entityId: string): Promise<string> {
  const trimmed = entityId?.trim() ?? ''
  if (trimmed === '') return ''
  const parsed = parseEntityId(trimmed)
  if (parsed == null) return trimmed
  try {
    switch (parsed.type) {
      case EntityType.QUEST: {
        const q = await questRepository.getById(trimmed)
        return q?.title ?? trimmed
      }
      case EntityType.INSIGHT: {
        const i = await insightRepository.getById(trimmed)
        return i?.title ?? trimmed
      }
      case EntityType.ITEM: {
        const i = await itemRepository.getById(trimmed)
        return i?.name ?? trimmed
      }
      case EntityType.PERSON: {
        const p = await personRepository.getById(trimmed)
        return p?.name ?? trimmed
      }
      case EntityType.PLACE: {
        const p = await placeRepository.getById(trimmed)
        return p?.name ?? trimmed
      }
      case EntityType.MAP: {
        const m = await mapRepository.getById(trimmed)
        return m?.name ?? trimmed
      }
      case EntityType.PATH: {
        const p = await pathRepository.getById(trimmed)
        return p?.name ?? trimmed
      }
      case EntityType.THREAD:
      default:
        return trimmed
    }
  } catch {
    return trimmed
  }
}
