/**
 * Quest completion status (playthrough-scoped).
 * Unavailability is derived from requirements (Phase 5.2), not stored as "blocked."
 * Aligned with docs/data-models.md.
 */
export enum QuestStatus {
  /** Quest is available but not yet active (default). */
  AVAILABLE = 0,
  /** Quest is in progress. */
  ACTIVE = 1,
  /** Quest is completed. */
  COMPLETED = 2,
  /** Quest is abandoned (failed/forfeit/uncompletable). */
  ABANDONED = 3,
}
