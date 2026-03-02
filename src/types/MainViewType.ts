/**
 * Main view types for the game view sidebar and content area.
 * Decouples navigable views from entity types and supports views like Loom and Oracle.
 * Which views appear and in what order is controlled by SECTIONS in GameViewSidebar.
 */
export enum MainViewType {
  /** Quests view */
  QUESTS = 0,

  /** Loom view */
  LOOM = 1,

  /** Maps view */
  MAPS = 2,

  /** Oracle view */
  ORACLE = 3,

  /** Places view */
  PLACES = 4,

  /** Paths view */
  PATHS = 5,

  /** Items view */
  ITEMS = 6,

  /** People view */
  PEOPLE = 7,

  /** Insights view */
  INSIGHTS = 8,

  /** Threads view */
  THREADS = 9,
}

/**
 * Display label for each main view type (sidebar and accessibility).
 */
export const MAIN_VIEW_TYPE_LABELS: Record<MainViewType, string> = {
  [MainViewType.QUESTS]: 'Quests',
  [MainViewType.LOOM]: 'Loom',
  [MainViewType.MAPS]: 'Maps',
  [MainViewType.ORACLE]: 'Oracle',
  [MainViewType.PLACES]: 'Places',
  [MainViewType.PATHS]: 'Paths',
  [MainViewType.ITEMS]: 'Items',
  [MainViewType.PEOPLE]: 'People',
  [MainViewType.INSIGHTS]: 'Insights',
  [MainViewType.THREADS]: 'Threads',
}

/**
 * Returns the display label for a main view type.
 *
 * @param viewType - The main view type.
 * @returns Human-readable label for the view.
 */
export function getMainViewTypeLabel(viewType: MainViewType): string {
  return MAIN_VIEW_TYPE_LABELS[viewType] ?? 'Unknown'
}
