/**
 * QuestLoom Dexie database: single IndexedDB instance with game-scoped and playthrough-scoped tables.
 * Schema enforces gameId / playthroughId separation; consumption is via repositories (Phase 1.2).
 */

import Dexie, { type Table } from 'dexie'
import type { Game } from '../types/Game'
import type { Playthrough } from '../types/Playthrough'
import type { Quest } from '../types/Quest'
import type { Insight } from '../types/Insight'
import type { Item } from '../types/Item'
import type { Person } from '../types/Person'
import type { Place } from '../types/Place'
import type { Map } from '../types/Map'
import type { Thread } from '../types/Thread'
import type { QuestProgress } from '../types/QuestProgress'
import type { InsightProgress } from '../types/InsightProgress'
import type { ItemState } from '../types/ItemState'
import type { EntityDiscovery } from '../types/EntityDiscovery'

/**
 * Stored row types: progress/discovery tables use string id (generated on insert).
 * Game/playthrough/entity tables use their existing id as primary key.
 */
export interface QuestProgressRow extends QuestProgress {
  id: string
}

export interface InsightProgressRow extends InsightProgress {
  id: string
}

export interface ItemStateRow extends ItemState {
  id: string
}

export interface EntityDiscoveryRow extends EntityDiscovery {
  id: string
}

/**
 * QuestLoom database schema and typed tables.
 * Do not call Dexie from components/stores; use repositories (Phase 1.2).
 */
export class QuestLoomDB extends Dexie {
  games!: Table<Game, string>
  playthroughs!: Table<Playthrough, string>
  quests!: Table<Quest, string>
  insights!: Table<Insight, string>
  items!: Table<Item, string>
  persons!: Table<Person, string>
  places!: Table<Place, string>
  maps!: Table<Map, string>
  threads!: Table<Thread, string>
  questProgress!: Table<QuestProgressRow, string>
  insightProgress!: Table<InsightProgressRow, string>
  itemState!: Table<ItemStateRow, string>
  entityDiscovery!: Table<EntityDiscoveryRow, string>

  constructor() {
    super('QuestLoomDB')
    this.version(1).stores({
      games: 'id',
      playthroughs: 'id, gameId',
      quests: 'id, gameId',
      insights: 'id, gameId',
      items: 'id, gameId',
      persons: 'id, gameId',
      places: 'id, gameId',
      maps: 'id, gameId',
      threads: 'id, gameId, playthroughId',
      questProgress: 'id, playthroughId, questId, [playthroughId+questId]',
      insightProgress:
        'id, playthroughId, insightId, [playthroughId+insightId]',
      itemState: 'id, playthroughId, itemId, [playthroughId+itemId]',
      entityDiscovery:
        'id, playthroughId, entityType, entityId, [playthroughId+entityType+entityId]',
    })
    // v2: type-in-ID; clear entity and progress tables so all new data uses typed IDs
    this.version(2)
      .stores({
        games: 'id',
        playthroughs: 'id, gameId',
        quests: 'id, gameId',
        insights: 'id, gameId',
        items: 'id, gameId',
        persons: 'id, gameId',
        places: 'id, gameId',
        maps: 'id, gameId',
        threads: 'id, gameId, playthroughId',
        questProgress: 'id, playthroughId, questId, [playthroughId+questId]',
        insightProgress:
          'id, playthroughId, insightId, [playthroughId+insightId]',
        itemState: 'id, playthroughId, itemId, [playthroughId+itemId]',
        entityDiscovery:
          'id, playthroughId, entityType, entityId, [playthroughId+entityType+entityId]',
      })
      .upgrade((tx) => {
        return Promise.all([
          tx.table('quests').clear(),
          tx.table('insights').clear(),
          tx.table('items').clear(),
          tx.table('persons').clear(),
          tx.table('places').clear(),
          tx.table('maps').clear(),
          tx.table('threads').clear(),
          tx.table('questProgress').clear(),
          tx.table('insightProgress').clear(),
          tx.table('itemState').clear(),
          tx.table('entityDiscovery').clear(),
        ])
      })
  }
}

/** Single Dexie instance for the app. Use via repositories, not directly from UI. */
export const db = new QuestLoomDB()
