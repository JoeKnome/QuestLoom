/**
 * Path traversal status (playthrough-scoped).
 * Stored in PathProgress; determines whether a path can be traversed in reachability logic.
 */
export enum PathStatus {
  /** Untraversable unless requirements are met (e.g. locked door). */
  RESTRICTED = 0,

  /** Traversable regardless of requirements (e.g. door unlocked). */
  OPENED = 1,

  /** Untraversable regardless of requirements (e.g. bridge collapsed). */
  BLOCKED = 2,
}
