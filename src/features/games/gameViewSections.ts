import { MainViewType } from '../../types/MainViewType'

/**
 * Sections of the game view sidebar in display order.
 * Controls which items appear and in what order.
 */
export const SECTIONS: MainViewType[] = [
  MainViewType.QUESTS,
  MainViewType.LOOM,
  MainViewType.ORACLE,
  MainViewType.MAPS,
  MainViewType.PLACES,
  MainViewType.PATHS,
  MainViewType.ITEMS,
  MainViewType.PEOPLE,
  MainViewType.INSIGHTS,
  MainViewType.THREADS,
]
