/**
 * Item possession/state (playthrough-scoped).
 * Aligned with docs/data-models.md.
 */
export enum ItemStatus {
  /** Item is possessed. */
  POSSESSED = 0,
  /** Item has been used. */
  USED = 1,
  /** Item has been lost. */
  LOST = 2,
  /** Other state. */
  OTHER = 3,
}
