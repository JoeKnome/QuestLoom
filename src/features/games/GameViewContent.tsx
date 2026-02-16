import type { GameId, PlaythroughId } from '../../types/ids'
import type { GameViewSection } from './GameViewSection'
import { GAME_VIEW_SECTION_LABELS } from './GameViewSection'
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
  /** The section to render. */
  section: GameViewSection
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
    case 'quests':
      return <QuestListScreen {...commonProps} />
    case 'insights':
      return <InsightListScreen {...commonProps} />
    case 'items':
      return <ItemListScreen {...commonProps} />
    case 'people':
      return <PersonListScreen {...commonProps} />
    case 'places':
      return <PlaceListScreen {...commonProps} />
    case 'maps':
      return <MapListScreen {...commonProps} />
    case 'threads':
      return <ThreadListScreen {...commonProps} />
    default: {
      const label = GAME_VIEW_SECTION_LABELS[section as GameViewSection]
      return (
        <p className="text-slate-500" aria-live="polite">
          {label} — coming soon
        </p>
      )
    }
  }
}
