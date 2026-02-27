import { useEffect, useState } from 'react'
import type { GameId, PlaceId, PlaythroughId } from '../types/ids'
import {
  computeReachablePlaces,
  type ReachabilityResult,
} from '../lib/reachability'

/**
 * Result of the useReachablePlaces hook.
 */
export interface UseReachablePlacesResult {
  /** Set of place IDs reachable from the start place. */
  reachablePlaceIds: Set<PlaceId>

  /** True while reachability is being computed. */
  isLoading: boolean

  /** Error message when computation fails, or null. */
  error: string | null
}

/**
 * Computes the set of reachable places from a start place for the given
 * game and playthrough. Wraps computeReachablePlaces in a React hook.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID, or null to skip computation.
 * @param startPlaceId - Typed ID of the start place, or null to skip computation.
 * @returns Reachable place IDs, loading flag, and error if any.
 */
export function useReachablePlaces(
  gameId: GameId | null,
  playthroughId: PlaythroughId | null,
  startPlaceId: PlaceId | null
): UseReachablePlacesResult {
  const [state, setState] = useState<UseReachablePlacesResult>({
    reachablePlaceIds: new Set<PlaceId>(),
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    // If required identifiers are missing, treat as empty reachable set.
    if (!gameId || !playthroughId || !startPlaceId) {
      setState({
        reachablePlaceIds: new Set<PlaceId>(),
        isLoading: false,
        error: null,
      })
      return
    }

    let cancelled = false
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }))

    computeReachablePlaces(gameId, playthroughId, startPlaceId)
      .then((result: ReachabilityResult) => {
        if (cancelled) return
        setState({
          reachablePlaceIds: result.reachablePlaceIds,
          isLoading: false,
          error: null,
        })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setState({
          reachablePlaceIds: new Set<PlaceId>(),
          isLoading: false,
          error:
            err instanceof Error
              ? err.message
              : 'Failed to compute reachability',
        })
      })

    return () => {
      cancelled = true
    }
  }, [gameId, playthroughId, startPlaceId])

  return state
}
