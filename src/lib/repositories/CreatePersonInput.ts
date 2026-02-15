import type { GameId } from '../../types/ids'

/**
 * Input for creating a person.
 * ID and timestamps are set by the repository.
 */
export interface CreatePersonInput {
  /** ID of the game this person belongs to. */
  gameId: GameId
  /** Character name. */
  name: string
  /** Optional author notes. */
  notes?: string
}
