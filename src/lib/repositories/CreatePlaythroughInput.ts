import type { GameId } from '../../types/ids'

/**
 * Input for creating a playthrough.
 * ID and timestamps are set by the repository.
 */
export interface CreatePlaythroughInput {
  /** ID of the game this playthrough belongs to. */
  gameId: GameId
  /** Optional playthrough name. */
  name?: string
}
