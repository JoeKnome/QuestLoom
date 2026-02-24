import { useEffect, useState } from 'react'
import type { GameId, PlaythroughId } from '../types/ids'
import { checkEntityAvailability } from '../lib/requirements/requirementEvaluation'

/**
 * Returns availability for an entity (derived from requirement threads and playthrough state).
 * Currently not used by list screens, which perform batched availability checks;
 * reserved for single-entity views or future components that need per-entity availability.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID (null skips the check).
 * @param entityId - Typed entity ID to check.
 * @returns available, unmetRequirementIds, isLoading.
 */
export function useEntityAvailability(
  gameId: GameId,
  playthroughId: PlaythroughId | null,
  entityId: string
): {
  /** Whether the entity is available. */
  available: boolean
  /** The IDs of the unmet requirement targets. */
  unmetRequirementIds: string[]
  /** Whether the availability is being loaded. */
  isLoading: boolean
} {
  const [available, setAvailable] = useState(true)
  const [unmetRequirementIds, setUnmetRequirementIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // No game ID, playthrough ID, or entity ID, so the entity is available.
    if (!gameId || !playthroughId || !entityId) {
      setAvailable(true)
      setUnmetRequirementIds([])
      setIsLoading(false)
      return
    }

    // Check availability of the entity.
    let cancelled = false
    setIsLoading(true)
    checkEntityAvailability(gameId, playthroughId, entityId)
      .then((result) => {
        if (!cancelled) {
          // Set availability and unmet requirement IDs.
          setAvailable(result.available)
          setUnmetRequirementIds(result.unmetRequirementTargetIds)
        }
      })
      .finally(() => {
        // Set loading state to false.
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [gameId, playthroughId, entityId])

  return { available, unmetRequirementIds, isLoading }
}
