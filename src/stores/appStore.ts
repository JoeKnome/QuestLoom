/**
 * App store: current game and playthrough selection.
 * Single source of truth for "current" context; optionally persists last selection in localStorage.
 */

import { create } from 'zustand'
import type { GameId, PlaythroughId } from '../types/ids'

/**
 * Storage key for current game ID.
 */
const STORAGE_KEY_GAME = 'questloom-current-game-id'

/**
 * Storage key for current playthrough ID.
 */
const STORAGE_KEY_PLAYTHROUGH = 'questloom-current-playthrough-id'

/**
 * Gets a stored ID from localStorage by key.
 *
 * @template T - ID type
 * @param key - Storage key to read from localStorage.
 * @returns The stored ID (typed) or null if not found.
 */
function getStoredId<T extends string>(key: string): T | null {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(key)
  return value && value.trim() !== '' ? (value as T) : null
}

/**
 * Gets the stored game ID from localStorage.
 *
 * @returns The stored game ID or null if not found.
 */
function getStoredGameId(): GameId | null {
  return getStoredId<GameId>(STORAGE_KEY_GAME)
}

/**
 * Gets the stored playthrough ID from localStorage.
 *
 * @returns The stored playthrough ID or null if not found.
 */
function getStoredPlaythroughId(): PlaythroughId | null {
  return getStoredId<PlaythroughId>(STORAGE_KEY_PLAYTHROUGH)
}

/**
 * App store state: current game and playthrough IDs.
 */
export interface AppState {
  /** Currently selected game ID, or null if none. */
  currentGameId: GameId | null

  /** Currently selected playthrough ID, or null if none. */
  currentPlaythroughId: PlaythroughId | null

  /** Sets the current game; persists to localStorage when non-null.
   *
   * @param id - Game ID to set; null to clear.
   */
  setCurrentGame: (id: GameId | null) => void

  /** Sets the current playthrough; persists to localStorage when non-null.
   *
   * @param id - Playthrough ID to set; null to clear.
   */
  setCurrentPlaythrough: (id: PlaythroughId | null) => void

  /** Sets both current game and playthrough in one call; persists when non-null.
   *
   * @param gameId - Game ID to set; null to clear.
   * @param playthroughId - Playthrough ID to set; null to clear.
   */
  setCurrentGameAndPlaythrough: (
    gameId: GameId | null,
    playthroughId: PlaythroughId | null
  ) => void
}

/**
 * Helper to set or remove an item in localStorage for the given key and value.
 *
 * @param key - LocalStorage key
 * @param value - Value to store, or null to remove
 */
function persistToLocalStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') return
  if (value !== null) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

/**
 * Zustand store for the app state.
 */
export const useAppStore = create<AppState>((set) => ({
  currentGameId: getStoredGameId(),
  currentPlaythroughId: getStoredPlaythroughId(),

  setCurrentGame: (id) => {
    persistToLocalStorage(STORAGE_KEY_GAME, id)
    set({ currentGameId: id })
  },

  setCurrentPlaythrough: (id) => {
    persistToLocalStorage(STORAGE_KEY_PLAYTHROUGH, id)
    set({ currentPlaythroughId: id })
  },

  setCurrentGameAndPlaythrough: (gameId, playthroughId) => {
    persistToLocalStorage(STORAGE_KEY_GAME, gameId)
    persistToLocalStorage(STORAGE_KEY_PLAYTHROUGH, playthroughId)
    set({ currentGameId: gameId, currentPlaythroughId: playthroughId })
  },
}))
