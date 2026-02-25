/**
 * Numeric enum for thread relationship subtypes.
 * Used for logic and filtering; user-facing labels are looked up via getThreadSubtypeDisplayLabel.
 * Replaces string-matching on thread label so the label is purely for display (or custom text when Custom).
 */
export enum ThreadSubtype {
  /** User-defined relationship; display uses thread.label. */
  CUSTOM = 0,

  /** Quest giver link (Quest → Person | Place). */
  GIVER = 1,

  /** Item location link (Item → Place). */
  LOCATION = 2,

  /** Place map link (Place → Map). */
  MAP = 3,

  /** Entity-level requirement: source unavailable until target is in allowed status set. */
  REQUIRES = 4,
  
  /** Quest objective dependency: objective completable when target is in allowed status set. */
  OBJECTIVE_REQUIRES = 5,
}
