/**
 * Person state (playthrough-scoped).
 * Tracks whether a character is alive, dead, or unknown in a specific playthrough.
 * Aligned with docs/data-models.md.
 */
export enum PersonStatus {
  /** Person is alive (default). */
  ALIVE = 0,
  /** Person is dead. */
  DEAD = 1,
  /** Person's status is unknown. */
  UNKNOWN = 2,
}
