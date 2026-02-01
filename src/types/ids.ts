/**
 * Shared ID types for entity references.
 * Uses string aliases for type safety and consistent references across game and playthrough data.
 */

/** Unique identifier for a game (session container). */
export type GameId = string

/** Unique identifier for a playthrough (one user's run of a game). */
export type PlaythroughId = string

/** Unique identifier for a quest. */
export type QuestId = string

/** Unique identifier for an insight. */
export type InsightId = string

/** Unique identifier for an item. */
export type ItemId = string

/** Unique identifier for a person. */
export type PersonId = string

/** Unique identifier for a place. */
export type PlaceId = string

/** Unique identifier for a map. */
export type MapId = string

/** Unique identifier for a thread (link between two entities). */
export type ThreadId = string
