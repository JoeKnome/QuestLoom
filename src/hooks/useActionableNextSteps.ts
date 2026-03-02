import { useEffect, useMemo, useState } from 'react'
import type { GameId, PlaceId, PlaythroughId } from '../types/ids'
import {
  getActionableEntities,
  getActionableRouteEdgeIds,
  type ActionableEntity,
} from '../lib/contextualProgression'

/**
 * Result of the useActionableNextSteps hook.
 */
export interface UseActionableNextStepsResult {
  /** List of actionable entities for Oracle display. */
  actionableEntities: ActionableEntity[]

  /** Set of actionable entity IDs for Loom/map styling. */
  actionableEntityIds: Set<string>

  /** Set of thread IDs on shortest routes to actionable nodes (for Loom edge styling). */
  actionableRouteEdgeIds: Set<string>

  /** True while loading. */
  isLoading: boolean

  /** Error message if computation failed. */
  error: string | null
}

/**
 * Computes actionable entities and route edge IDs for the current playthrough state.
 * Used by Oracle, Loom, and Map to show "what you can do next" and highlight routes.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID, or null to skip.
 * @param reachablePlaceIds - Reachable place IDs from current position.
 * @param currentPositionPlaceId - Current position (start for route computation).
 * @returns Actionable entities, entity ID set, route edge ID set, loading, and error.
 */
export function useActionableNextSteps(
  gameId: GameId | null,
  playthroughId: PlaythroughId | null,
  reachablePlaceIds: Set<PlaceId>,
  currentPositionPlaceId: PlaceId | null
): UseActionableNextStepsResult {
  const [actionableEntities, setActionableEntities] = useState<
    ActionableEntity[]
  >([])
  const [actionableRouteEdgeIds, setActionableRouteEdgeIds] = useState<
    Set<string>
  >(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reachablePlaceIdsKey = useMemo(
    () => Array.from(reachablePlaceIds).sort().join(','),
    [reachablePlaceIds]
  )

  // Compute actionable entities and route edge IDs.
  useEffect(() => {
    // If no game ID or playthrough ID, set state to empty and return.
    if (!gameId || !playthroughId) {
      setActionableEntities([])
      setActionableRouteEdgeIds(new Set())
      setIsLoading(false)
      setError(null)
      return
    }

    // Set loading state to true and error state to null.
    let cancelled = false
    setIsLoading(true)
    setError(null)

    // Get actionable entities.
    getActionableEntities(gameId, playthroughId, reachablePlaceIds)
      .then((entities) => {
        if (cancelled) return
        setActionableEntities(entities)
        const entityIds = new Set(entities.map((e) => e.entityId))

        // Get actionable route edge IDs.
        return getActionableRouteEdgeIds(
          gameId,
          playthroughId,
          currentPositionPlaceId,
          reachablePlaceIds,
          entityIds
        )
      })
      .then((edgeIds) => {
        // If cancelled or edge IDs are undefined, return.
        if (cancelled || edgeIds === undefined) return
        setActionableRouteEdgeIds(edgeIds)
      })
      .catch((err: unknown) => {
        // If cancelled, return.
        if (cancelled) return

        // Set state to empty.
        setActionableEntities([])
        setActionableRouteEdgeIds(new Set())
        setIsLoading(false)

        // Set error state to message or 'Failed to load actionable steps'.
        setError(
          err instanceof Error ? err.message : 'Failed to load actionable steps'
        )
      })
      .finally(() => {
        // If not cancelled, set loading state to false.
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    gameId,
    playthroughId,
    reachablePlaceIdsKey,
    currentPositionPlaceId,
    reachablePlaceIds,
  ])

  const actionableEntityIds = useMemo(
    () => new Set(actionableEntities.map((e) => e.entityId)),
    [actionableEntities]
  )

  return {
    actionableEntities,
    actionableEntityIds,
    actionableRouteEdgeIds,
    isLoading,
    error,
  }
}
