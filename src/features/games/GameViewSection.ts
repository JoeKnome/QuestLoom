/**
 * Section identifiers for the game view sidebar.
 * Each value corresponds to one feature area (list + CRUD).
 */
export type GameViewSection =
  | 'quests'
  | 'insights'
  | 'items'
  | 'people'
  | 'places'
  | 'maps'
  | 'threads'

/**
 * Human-readable labels for each section (for sidebar and aria).
 */
export const GAME_VIEW_SECTION_LABELS: Record<GameViewSection, string> = {
  quests: 'Quests',
  insights: 'Insights',
  items: 'Items',
  people: 'People',
  places: 'Places',
  maps: 'Maps',
  threads: 'Threads',
}
