/**
 * Reserved thread labels for entity-to-entity links that are dual-written
 * with entity fields. Used when creating/updating representative threads.
 */

/** Thread label for quest giver link (Quest → Person | Place). */
export const THREAD_LABEL_GIVER = 'giver'

/** Thread label for item location link (Item → Place). */
export const THREAD_LABEL_LOCATION = 'location'

/** Thread label for place map link (Place → Map). */
export const THREAD_LABEL_MAP = 'map'

/** Thread label for entity-level requirement (A requires B). Source is unavailable until target is in allowed status set. */
export const THREAD_LABEL_REQUIRES = 'requires'

/** Thread label for quest objective dependency (Quest objective is completable when entity is in allowed status set). Differentiates from entity-level requires in the Loom. */
export const THREAD_LABEL_OBJECTIVE_REQUIRES = 'objective_requires'
