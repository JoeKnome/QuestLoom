/**
 * Game view UI store: tracks map-specific UI state such as
 * whether the Maps section is showing the selection grid or
 * an individual map view, and remembers the last viewed map.
 */

import { create } from 'zustand'
import type { MapId } from '../types/ids'

/**
 * Possible UI modes for the Maps section in the game view.
 * - 'selection' shows the grid of maps to choose from.
 * - 'view' shows a single selected map.
 */
export type MapUiMode = 'selection' | 'view'

/**
 * Internal state shape for the game view store.
 * Tracks map UI mode and the last viewed map ID.
 */
interface GameViewState {
  /**
   * Current UI mode for the Maps section.
   * When 'selection', the grid of maps is shown.
   * When 'view', a single map is shown.
   */
  mapUiMode: MapUiMode

  /**
   * ID of the last viewed map in the Maps section, or null if none.
   * Used so that returning to the Maps tab can restore the last map view.
   */
  lastViewedMapId: MapId | null

  /**
   * Sets the current map UI mode.
   *
   * @param mode - Next UI mode for the Maps section.
   */
  setMapUiMode: (mode: MapUiMode) => void

  /**
   * Sets the last viewed map ID.
   *
   * @param mapId - Map ID to remember, or null to clear.
   */
  setLastViewedMapId: (mapId: MapId | null) => void

  /**
   * Opens the map selection grid in the Maps section and
   * leaves the last viewed map ID unchanged.
   */
  openMapSelection: () => void

  /**
   * Opens the map view for the given map ID and remembers it
   * as the last viewed map.
   *
   * @param mapId - Map ID to view.
   */
  openMapView: (mapId: MapId) => void
}

/**
 * Zustand store for game view UI state.
 * Holds map-specific UI mode and the last viewed map ID so that
 * Maps tab interactions can toggle between selection and view.
 */
export const useGameViewStore = create<GameViewState>((set) => ({
  mapUiMode: 'selection',
  lastViewedMapId: null,

  setMapUiMode: (mode) => {
    set({ mapUiMode: mode })
  },

  setLastViewedMapId: (mapId) => {
    set({ lastViewedMapId: mapId })
  },

  openMapSelection: () => {
    set({ mapUiMode: 'selection' })
  },

  openMapView: (mapId) => {
    set({ mapUiMode: 'view', lastViewedMapId: mapId })
  },
}))
