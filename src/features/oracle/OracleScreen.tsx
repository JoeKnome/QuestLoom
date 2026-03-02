import type { GameId, PlaceId, PlaythroughId } from '../../types/ids'
import { useActionableNextSteps } from '../../hooks/useActionableNextSteps'

/**
 * Props for the OracleScreen component.
 */
export interface OracleScreenProps {
  /** Current game ID. */
  gameId: GameId

  /** Current playthrough ID (may be null). */
  playthroughId: PlaythroughId | null

  /** Reachable place IDs from current position. */
  reachablePlaceIds: Set<PlaceId>

  /** Current position place ID (for route computation). */
  currentPositionPlaceId: PlaceId | null
}

/**
 * OracleScreen view: lists "what you can do next" based on current playthrough state,
 * availability, and reachability. Rendered in the main panel when the Oracle
 * sidebar tab is selected.
 *
 * @param props - OracleScreen props (gameId, playthroughId, reachablePlaceIds, currentPositionPlaceId).
 * @returns A JSX element representing the OracleScreen component.
 */
export function OracleScreen({
  gameId,
  playthroughId,
  reachablePlaceIds,
  currentPositionPlaceId,
}: OracleScreenProps): JSX.Element {
  const { actionableEntities, isLoading, error } = useActionableNextSteps(
    gameId,
    playthroughId,
    reachablePlaceIds,
    currentPositionPlaceId
  )

  // Loading state.
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-slate-500">
        Loading…
      </div>
    )
  }

  // Error state.
  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-red-600">
        {error}
      </div>
    )
  }

  // No actionable entities state.
  if (actionableEntities.length === 0) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-slate-500">
        <p className="font-medium">Oracle</p>
        <p className="text-sm">
          {playthroughId == null
            ? 'Select a playthrough to see what you can do next.'
            : currentPositionPlaceId == null
              ? 'Set your current position to see where you can go and what you can do next.'
              : 'Nothing actionable right now.'}
        </p>
      </div>
    )
  }

  // Actionable entities state.
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-slate-800">Oracle</h2>
      <p className="text-sm text-slate-600">
        What you can do next based on your current progress and position.
      </p>
      <ul className="flex flex-col gap-2" aria-label="Actionable next steps">
        {actionableEntities.map((item) => (
          <li
            key={`${item.entityId}-${item.objectiveIndex ?? 'e'}`}
            className="flex flex-col gap-0.5 rounded border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.actionLabel}
            </span>
            <span className="text-sm">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
