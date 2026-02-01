/**
 * Insight resolution status (playthrough-scoped).
 * Aligned with docs/data-models.md.
 */
export enum InsightStatus {
  /** Insight is active / not yet resolved. */
  ACTIVE = 0,
  /** Insight has been resolved. */
  RESOLVED = 1,
  /** Insight is irrelevant. */
  IRRELEVANT = 2,
}
