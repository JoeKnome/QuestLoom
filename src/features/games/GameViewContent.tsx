import { EntityType } from '../../types/EntityType'
import type { GameId, PlaceId, PlaythroughId } from '../../types/ids'
import { ENTITY_TYPE_PLURAL_LABELS } from '../../utils/entityTypeLabels'
import { InsightListScreen } from '../insights/InsightListScreen'
import { ItemListScreen } from '../items/ItemListScreen'
import { LoomView } from '../loom/LoomView'
import { MapsSection } from '../maps/MapsSection'
import { PathListScreen } from '../paths/PathListScreen'
import { PersonListScreen } from '../people/PersonListScreen'
import { PlaceListScreen } from '../places/PlaceListScreen'
import { QuestListScreen } from '../quests/QuestListScreen'

/**
 * Props for the GameViewContent component.
 */
export interface GameViewContentProps {
  /** Current game ID. */
  gameId: GameId

  /** Current playthrough ID (may be null). */
  playthroughId: PlaythroughId | null

  /** The section to render (entity type). */
  section: EntityType

  /** Reachable place IDs from current position (for Loom/Map availability). */
  reachablePlaceIds: Set<PlaceId>
}

/**
 * Renders the content for the active game view section.
 * Each section is a feature list screen with CRUD; receives gameId and playthroughId from GameView.
 *
 * @param props.gameId - Current game ID.
 * @param props.playthroughId - Current playthrough ID.
 * @param props.section - Active section key.
 * @returns A JSX element representing the GameViewContent component.
 */
export function GameViewContent({
  gameId,
  playthroughId,
  section,
  reachablePlaceIds,
}: GameViewContentProps): JSX.Element {
  const commonProps = { gameId, playthroughId, reachablePlaceIds }

  const content = (() => {
    switch (section) {
      case EntityType.QUEST:
        return <QuestListScreen {...commonProps} />
      case EntityType.INSIGHT:
        return <InsightListScreen {...commonProps} />
      case EntityType.ITEM:
        return <ItemListScreen {...commonProps} />
      case EntityType.PERSON:
        return <PersonListScreen {...commonProps} />
      case EntityType.PLACE:
        return <PlaceListScreen {...commonProps} />
      case EntityType.PATH:
        return <PathListScreen {...commonProps} />
      case EntityType.MAP:
        return (
          <MapsSection
            gameId={gameId}
            playthroughId={playthroughId}
            reachablePlaceIds={reachablePlaceIds}
          />
        )
      case EntityType.THREAD:
        return (
          <LoomView
            gameId={gameId}
            playthroughId={playthroughId}
            reachablePlaceIds={reachablePlaceIds}
          />
        )
      default: {
        const label = ENTITY_TYPE_PLURAL_LABELS[section]
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
