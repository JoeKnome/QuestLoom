/**
 * Item possession/state (playthrough-scoped).
 * Only ACQUIRED counts as "owned" for fulfilling requirements.
 * Aligned with docs/data-models.md.
 */
export enum ItemStatus {
  /** Item has not been acquired (default for new items and new playthroughs). */
  NOT_ACQUIRED = 0,
  /** Item is acquired; only this status counts as owned for requirements. */
  ACQUIRED = 1,
  /** Item has been used. */
  USED = 2,
  /** Item has been lost. */
  LOST = 3,
}
