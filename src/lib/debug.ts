/**
 * Debug utilities for development: purge local database and localStorage selection.
 * For development/debug only; wipes data without deleting the database schema.
 */

import { db } from './db'
import {
  useAppStore,
  STORAGE_KEY_GAME,
  STORAGE_KEY_PLAYTHROUGH,
} from '../stores/appStore'

/**
 * Clears all tables in the local IndexedDB database. Does not delete the database
 * itself so the schema remains. For development/debug only; wipes all data.
 *
 * @remarks Use when resetting local state; after calling, the app should clear
 * current game/playthrough selection and refresh lists.
 */
export async function purgeDatabase(): Promise<void> {
  await db.games.clear()
  await db.playthroughs.clear()
  await db.quests.clear()
  await db.insights.clear()
  await db.items.clear()
  await db.persons.clear()
  await db.places.clear()
  await db.maps.clear()
  await db.threads.clear()
  await db.questProgress.clear()
  await db.insightProgress.clear()
  await db.itemState.clear()
  await db.entityDiscovery.clear()
}

/**
 * Removes this app's current game/playthrough keys from localStorage and resets
 * the app store so the in-memory selection is cleared. Use for debug or when
 * the user wants to clear "current" selection without deleting game data.
 */
export function purgeLocalStorageSelection(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY_GAME)
  localStorage.removeItem(STORAGE_KEY_PLAYTHROUGH)
  useAppStore.getState().setCurrentGameAndPlaythrough(null, null)
}
