import type { GameId, PlaythroughId } from '../../types/ids'
import { EntityType } from '../../types/EntityType'
import { ENTITY_TYPE_PLURAL_LABELS } from '../../utils/entityTypeLabels'
import { InsightListScreen } from '../insights/InsightListScreen'
import { ItemListScreen } from '../items/ItemListScreen'
import { MapListScreen } from '../maps/MapListScreen'
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
  /** The section to render (entity type). */
  section: EntityType
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
}: GameViewContentProps): JSX.Element {
  const commonProps = { gameId, playthroughId }

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
    case EntityType.MAP:
      return <MapListScreen {...commonProps} />
    case EntityType.THREAD:
      return <ThreadListScreen {...commonProps} />
    default: {
      const label = ENTITY_TYPE_PLURAL_LABELS[section]
      return (
        <p className="text-slate-500" aria-live="polite">
          {label} — coming soon
        </p>
      )
    }
  }
}
