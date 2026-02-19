import type { GameId } from '../../types/ids'
import type { MapImageSourceType } from '../../types/Map'

/**
 * Input for creating a map.
 * ID and timestamps are set by the repository.
 * All image fields are optional for "no image yet".
 */
export interface CreateMapInput {
  /** ID of the game this map belongs to. */
  gameId: GameId
  /** Map label. */
  name: string
  /** How the image is provided. */
  imageSourceType?: MapImageSourceType
  /** HTTP(S) URL; used when imageSourceType === 'url'. */
  imageUrl?: string
  /** Reference to uploaded image; used when imageSourceType === 'upload'. */
  imageBlobId?: string
}
