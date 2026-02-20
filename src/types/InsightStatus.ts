/**
 * Insight resolution status (playthrough-scoped).
 * Only KNOWN qualifies for requirement checks.
 * Aligned with docs/data-models.md.
 */
export enum InsightStatus {
  /** Insight is not yet known (default). */
  UNKNOWN = 0,
  /** Insight is known; only this status qualifies for requirements. */
  KNOWN = 1,
  /** Insight is irrelevant. */
  IRRELEVANT = 2,
}
