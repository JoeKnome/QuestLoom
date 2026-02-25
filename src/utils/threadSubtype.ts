import type { Thread } from '../types/Thread'
import { ThreadSubtype } from '../types/ThreadSubtype'

/**
 * User-facing display label for each thread subtype (reserved types only).
 * Custom uses the thread's label; pass it to getThreadSubtypeDisplayLabel when needed.
 *
 * @param subtype - The thread subtype.
 * @param customLabel - When subtype is Custom, this is the label to display; otherwise ignored.
 * @returns Human-readable label for the thread edge/relationship.
 */
export function getThreadSubtypeDisplayLabel(
  subtype: ThreadSubtype,
  customLabel?: string
): string {
  switch (subtype) {
    case ThreadSubtype.CUSTOM:
      return customLabel?.trim() ?? ''
    case ThreadSubtype.GIVER:
      return 'Giver'
    case ThreadSubtype.LOCATION:
      return 'Location'
    case ThreadSubtype.MAP:
      return 'Map'
    case ThreadSubtype.REQUIRES:
      return 'Requires'
    case ThreadSubtype.OBJECTIVE_REQUIRES:
      return 'Objective'
    default:
      return ''
  }
}

/**
 * Returns the subtype for a thread.
 *
 * @param thread - The thread.
 * @returns ThreadSubtype for logic and filtering.
 */
export function getThreadSubtype(thread: Thread): ThreadSubtype {
  return thread.subtype
}

/**
 * Returns the user-facing display label for a thread (consistent formatting for reserved types).
 *
 * @param thread - The thread.
 * @returns Label to show in the loom and elsewhere.
 */
export function getThreadDisplayLabel(thread: Thread): string {
  return getThreadSubtypeDisplayLabel(thread.subtype, thread.label)
}
