/**
 * Quest completion status (playthrough-scoped).
 * Aligned with docs/data-models.md.
 */
export enum QuestStatus {
  /** Quest is in progress. */
  ACTIVE = 0,
  /** Quest is completed. */
  COMPLETED = 1,
  /** Quest is blocked. */
  BLOCKED = 2,
}
