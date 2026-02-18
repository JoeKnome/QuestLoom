import { useGameViewStore } from '../../stores/gameViewStore'
import type { GameId, PlaythroughId } from '../../types/ids'
import { MapListScreen } from './MapListScreen'
import { MapView } from './MapView'

/**
 * Props for the MapsSection component.
 */
export interface MapsSectionProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID, or null (unused for maps but kept for parity). */
  playthroughId: PlaythroughId | null
}

/**
 * Maps section wrapper for the game view.
 * Chooses between the map selection grid and the single-map view
 * based on map UI state in the game view store.
 *
 * @param props.gameId - Current game ID.
 * @param props.playthroughId - Current playthrough ID (unused for maps).
 * @returns A JSX element representing the MapsSection component.
 */
export function MapsSection({
  gameId,
  playthroughId,
}: MapsSectionProps): JSX.Element {
  const mapUiMode = useGameViewStore((s) => s.mapUiMode)
  const lastViewedMapId = useGameViewStore((s) => s.lastViewedMapId)

  if (mapUiMode === 'view' && lastViewedMapId !== null) {
    return <MapView gameId={gameId} mapId={lastViewedMapId} />
  }

  return <MapListScreen gameId={gameId} playthroughId={playthroughId} />
}
