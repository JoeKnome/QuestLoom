/**
 * QuestLoom Dexie database: single IndexedDB instance with game-scoped and playthrough-scoped tables.
 * Schema enforces gameId / playthroughId separation; consumption is via repositories (Phase 1.2).
 */

import Dexie, { type Table } from 'dexie'
import type { GameId, MapId } from '../types/ids'
import type { Game } from '../types/Game'
import type { Playthrough } from '../types/Playthrough'
import type { Quest } from '../types/Quest'
import type { Insight } from '../types/Insight'
import type { Item } from '../types/Item'
import type { Person } from '../types/Person'
import type { Place } from '../types/Place'
import type { Map } from '../types/Map'
import type { MapMarker } from '../types/MapMarker'
import type { Thread } from '../types/Thread'
import type { QuestProgress } from '../types/QuestProgress'
import type { InsightProgress } from '../types/InsightProgress'
import type { ItemState } from '../types/ItemState'
import type { PersonProgress } from '../types/PersonProgress'
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

export interface PersonProgressRow extends PersonProgress {
  id: string
}

export interface EntityDiscoveryRow extends EntityDiscovery {
  id: string
}

/**
 * Stored row type for map markers.
 * Mirrors the MapMarker type and is keyed by id.
 */
export interface MapMarkerRow extends MapMarker {
  /** Primary key for Dexie; same as MapMarker.id. */
  id: string
}

/**
 * Stored uploaded map image blob.
 * Used when Map.imageSourceType === 'upload'; Map.imageBlobId references id.
 */
export interface MapImageBlobRow {
  /** Unique identifier (same as Map.imageBlobId). */
  id: string
  /** Game this blob belongs to (for cascade delete). */
  gameId: GameId
  /** Map this blob is attached to (for cleanup on source change). */
  mapId: MapId
  /** The image binary. */
  blob: Blob
  /** Creation timestamp (ISO 8601). */
  createdAt: string
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
  personProgress!: Table<PersonProgressRow, string>
  entityDiscovery!: Table<EntityDiscoveryRow, string>
  mapImages!: Table<MapImageBlobRow, string>
  mapMarkers!: Table<MapMarkerRow, string>

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
    this.version(2).stores({
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
    // v3: map image blobs for upload source
    this.version(3).stores({
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
      mapImages: 'id, gameId, mapId',
    })
    // v4: top-level place per map (topLevelPlaceId index)
    this.version(4).stores({
      games: 'id',
      playthroughs: 'id, gameId',
      quests: 'id, gameId',
      insights: 'id, gameId',
      items: 'id, gameId',
      persons: 'id, gameId',
      places: 'id, gameId',
      maps: 'id, gameId, topLevelPlaceId',
      threads: 'id, gameId, playthroughId',
      questProgress: 'id, playthroughId, questId, [playthroughId+questId]',
      insightProgress:
        'id, playthroughId, insightId, [playthroughId+insightId]',
      itemState: 'id, playthroughId, itemId, [playthroughId+itemId]',
      entityDiscovery:
        'id, playthroughId, entityType, entityId, [playthroughId+entityType+entityId]',
      mapImages: 'id, gameId, mapId',
    })
    // v5: map markers table (game/map/playthrough-scoped markers)
    this.version(5).stores({
      games: 'id',
      playthroughs: 'id, gameId',
      quests: 'id, gameId',
      insights: 'id, gameId',
      items: 'id, gameId',
      persons: 'id, gameId',
      places: 'id, gameId',
      maps: 'id, gameId, topLevelPlaceId',
      threads: 'id, gameId, playthroughId',
      questProgress: 'id, playthroughId, questId, [playthroughId+questId]',
      insightProgress:
        'id, playthroughId, insightId, [playthroughId+insightId]',
      itemState: 'id, playthroughId, itemId, [playthroughId+itemId]',
      entityDiscovery:
        'id, playthroughId, entityType, entityId, [playthroughId+entityType+entityId]',
      mapImages: 'id, gameId, mapId',
      mapMarkers: 'id, gameId, mapId, playthroughId, [gameId+mapId]',
    })
    // v6: person progress (playthrough-scoped person status)
    this.version(6).stores({
      games: 'id',
      playthroughs: 'id, gameId',
      quests: 'id, gameId',
      insights: 'id, gameId',
      items: 'id, gameId',
      persons: 'id, gameId',
      places: 'id, gameId',
      maps: 'id, gameId, topLevelPlaceId',
      threads: 'id, gameId, playthroughId',
      questProgress: 'id, playthroughId, questId, [playthroughId+questId]',
      insightProgress:
        'id, playthroughId, insightId, [playthroughId+insightId]',
      itemState: 'id, playthroughId, itemId, [playthroughId+itemId]',
      personProgress: 'id, playthroughId, personId, [playthroughId+personId]',
      entityDiscovery:
        'id, playthroughId, entityType, entityId, [playthroughId+entityType+entityId]',
      mapImages: 'id, gameId, mapId',
      mapMarkers: 'id, gameId, mapId, playthroughId, [gameId+mapId]',
    })
  }
}

/** Single Dexie instance for the app. Use via repositories, not directly from UI. */
export const db = new QuestLoomDB()
