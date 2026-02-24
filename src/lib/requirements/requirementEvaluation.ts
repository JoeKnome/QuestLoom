import { EntityType } from '../../types/EntityType'
import type { GameId, PlaythroughId } from '../../types/ids'
import type { Quest } from '../../types/Quest'
import type { Thread } from '../../types/Thread'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import {
  insightRepository,
  itemRepository,
  personRepository,
  questRepository,
  threadRepository,
} from '../repositories'
import { DEFAULT_ALLOWED_STATUSES } from './defaultAllowedStatuses'

/**
 * Result of checking whether an entity is available (its requirements are satisfied).
 */
export interface AvailabilityResult {
  /** True if all requirement threads for this entity are satisfied. */
  available: boolean
  /** Typed entity IDs of requirement targets that are not satisfied. */
  unmetRequirementTargetIds: string[]
}

/**
 * Returns whether a requirement is satisfied: target's current status is in the
 * thread's allowed set (or default for target type).
 *
 * @param thread - Requirement thread (label 'requires' or 'objective_requires').
 * @param targetEntityType - Entity type of the target (thread.targetId).
 * @param currentStatus - Target's current playthrough status (enum value).
 * @returns True if currentStatus is in the allowed set.
 */
export function isRequirementSatisfied(
  thread: Thread,
  targetEntityType: EntityType,
  currentStatus: number
): boolean {
  const allowed =
    thread.requirementAllowedStatuses != null &&
    thread.requirementAllowedStatuses.length > 0
      ? thread.requirementAllowedStatuses
      : DEFAULT_ALLOWED_STATUSES[targetEntityType]
  return allowed.includes(currentStatus)
}

/**
 * Loads the current playthrough status for an entity (quest, insight, item, person).
 * Place/Map/Thread have no playthrough status; returns null.
 *
 * @param playthroughId - Current playthrough.
 * @param entityId - Typed entity ID.
 * @returns Status enum value, or null if no progress/state or unsupported type.
 */
export async function getPlaythroughStatusForEntity(
  playthroughId: PlaythroughId,
  entityId: string
): Promise<number | null> {
  const type = getEntityTypeFromId(entityId)
  if (type == null) return null
  switch (type) {
    case EntityType.QUEST: {
      const p = await questRepository.getProgress(playthroughId, entityId)
      return p?.status ?? null
    }
    case EntityType.INSIGHT: {
      const p = await insightRepository.getProgress(playthroughId, entityId)
      return p?.status ?? null
    }
    case EntityType.ITEM: {
      const s = await itemRepository.getState(playthroughId, entityId)
      return s?.status ?? null
    }
    case EntityType.PERSON: {
      const p = await personRepository.getProgress(playthroughId, entityId)
      return p?.status ?? null
    }
    case EntityType.PLACE:
    case EntityType.MAP:
    case EntityType.THREAD:
    default:
      return null
  }
}

/**
 * Checks whether an entity is available: all its entity-level requirement threads
 * (label 'requires') are satisfied for the given playthrough state.
 *
 * @param gameId - Current game.
 * @param playthroughId - Current playthrough (required for status lookups).
 * @param entityId - Typed entity ID whose availability to check.
 * @returns Availability result with unmet requirement target IDs if any.
 */
export async function checkEntityAvailability(
  gameId: GameId,
  playthroughId: PlaythroughId,
  entityId: string
): Promise<AvailabilityResult> {
  const threads = await threadRepository.getRequirementThreadsFromEntity(
    gameId,
    entityId
  )

  // Get the IDs of the unmet requirement targets.
  const unmetRequirementTargetIds: string[] = []
  for (const thread of threads) {
    const targetType = getEntityTypeFromId(thread.targetId)
    if (targetType == null) continue

    // Place/Map/Thread have no playthrough status, so they are not considered for availability.
    if (
      targetType === EntityType.PLACE ||
      targetType === EntityType.MAP ||
      targetType === EntityType.THREAD
    ) {
      continue
    }
    const currentStatus = await getPlaythroughStatusForEntity(
      playthroughId,
      thread.targetId
    )
    if (currentStatus === null) {
      unmetRequirementTargetIds.push(thread.targetId)
      continue
    }
    if (!isRequirementSatisfied(thread, targetType, currentStatus)) {
      unmetRequirementTargetIds.push(thread.targetId)
    }
  }
  return {
    available: unmetRequirementTargetIds.length === 0,
    unmetRequirementTargetIds,
  }
}

/**
 * Returns whether a quest objective is completable: when the objective has entityId,
 * the referenced entity's playthrough status must be in the allowed set (or type default).
 * When the objective has no entityId, returns true (no entity gate).
 *
 * @param playthroughId - Current playthrough.
 * @param quest - The quest containing the objective.
 * @param objectiveIndex - 0-based index of the objective.
 * @returns True if the objective is completable (user may then mark it complete).
 */
export async function getObjectiveCompletability(
  playthroughId: PlaythroughId,
  quest: Quest,
  objectiveIndex: number
): Promise<boolean> {
  const obj = quest.objectives[objectiveIndex]
  if (!obj?.entityId) return true
  const currentStatus = await getPlaythroughStatusForEntity(
    playthroughId,
    obj.entityId
  )
  if (currentStatus === null) return false
  const type = getEntityTypeFromId(obj.entityId)
  if (type == null) return false
  const allowed =
    obj.allowedStatuses != null && obj.allowedStatuses.length > 0
      ? obj.allowedStatuses
      : DEFAULT_ALLOWED_STATUSES[type]
  return allowed.includes(currentStatus)
}
