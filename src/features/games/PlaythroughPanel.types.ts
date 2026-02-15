import type { GameId, PlaythroughId } from '../../types/ids'
import type { Playthrough } from '../../types/Playthrough'

/**
 * Props for the PlaythroughPanel component.
 */
export interface PlaythroughPanelProps {
  /** ID of the game whose playthroughs are shown. */
  gameId: GameId
  /** Currently selected playthrough ID, or null. */
  currentPlaythroughId: PlaythroughId | null
  /** List of playthroughs for the game. */
  playthroughs: Playthrough[]
  /** Called when the user closes the panel. */
  onClose: () => void
  /** Called after create/update/delete so the parent can refetch and sync. */
  onPlaythroughsChange: () => void
}
