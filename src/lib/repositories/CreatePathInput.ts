import type { GameId } from '../../types/ids'

/**
 * Input for creating a path.
 * ID and timestamps are set by the repository.
 */
export interface CreatePathInput {
  /** ID of the game this path belongs to. */
  gameId: GameId

  /** Path name. */
  name: string
  
  /** Optional description of how this path connects places. */
  description?: string
}
