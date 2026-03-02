import { MainViewType } from '../../types/MainViewType'
import type { GameId, PlaceId, PlaythroughId } from '../../types/ids'
import { OracleScreen } from '../oracle/OracleScreen'
import { InsightListScreen } from '../insights/InsightListScreen'
import { ItemListScreen } from '../items/ItemListScreen'
import { LoomView } from '../loom/LoomView'
import { MapsSection } from '../maps/MapsSection'
import { PathListScreen } from '../paths/PathListScreen'
import { PersonListScreen } from '../people/PersonListScreen'
import { PlaceListScreen } from '../places/PlaceListScreen'
import { QuestListScreen } from '../quests/QuestListScreen'
import { ThreadListScreen } from '../threads/ThreadListScreen'

/**
 * Props for the GameViewContent component.
 */
export interface GameViewContentProps {
  /** Current game ID. */
  gameId: GameId

  /** Current playthrough ID (may be null). */
  playthroughId: PlaythroughId | null

  /** The section to render (main view type). */
  section: MainViewType

  /** Reachable place IDs from current position (for Loom/Map availability). */
  reachablePlaceIds: Set<PlaceId>

  /** Current position place ID (for Oracle and Loom routes). */
  currentPositionPlaceId: PlaceId | null

  /** Set of actionable entity IDs (for Loom/map emphasis). */
  actionableEntityIds: Set<string>

  /** Set of thread IDs on actionable routes (for Loom edge styling). */
  actionableRouteEdgeIds: Set<string>
}

/**
 * Renders the content for the active game view section.
 * Each section is a feature list screen, Loom, Maps, or Oracle.
 *
 * @param props - GameViewContent props.
 * @returns A JSX element representing the GameViewContent component.
 */
export function GameViewContent({
  gameId,
  playthroughId,
  section,
  reachablePlaceIds,
  currentPositionPlaceId,
  actionableEntityIds,
  actionableRouteEdgeIds,
}: GameViewContentProps): JSX.Element {
  const commonProps = { gameId, playthroughId, reachablePlaceIds }

  const content = (() => {
    switch (section) {
      case MainViewType.QUESTS:
        return <QuestListScreen {...commonProps} />
      case MainViewType.LOOM:
        return (
          <LoomView
            gameId={gameId}
            playthroughId={playthroughId}
            reachablePlaceIds={reachablePlaceIds}
            actionableRouteEdgeIds={actionableRouteEdgeIds}
          />
        )
      case MainViewType.MAPS:
        return (
          <MapsSection
            gameId={gameId}
            playthroughId={playthroughId}
            reachablePlaceIds={reachablePlaceIds}
            actionableEntityIds={actionableEntityIds}
          />
        )
      case MainViewType.ORACLE:
        return (
          <OracleScreen
            gameId={gameId}
            playthroughId={playthroughId}
            reachablePlaceIds={reachablePlaceIds}
            currentPositionPlaceId={currentPositionPlaceId}
          />
        )
      case MainViewType.PLACES:
        return <PlaceListScreen {...commonProps} />
      case MainViewType.PATHS:
        return <PathListScreen {...commonProps} />
      case MainViewType.ITEMS:
        return <ItemListScreen {...commonProps} />
      case MainViewType.PEOPLE:
        return <PersonListScreen {...commonProps} />
      case MainViewType.INSIGHTS:
        return <InsightListScreen {...commonProps} />
      case MainViewType.THREADS:
        return <ThreadListScreen {...commonProps} />
      default: {
        const label = MainViewType[section] ?? 'Unknown'
        return (
          <p className="text-slate-500" aria-live="polite">
            {label} — coming soon
          </p>
        )
      }
    }
  })()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">{content}</div>
  )
}
