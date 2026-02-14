/**
 * Generates a new unique identifier for entities.
 * Uses crypto.randomUUID() for compatibility and future swap.
 *
 * @returns A new UUID string
 */
export function generateId(): string {
  return crypto.randomUUID()
}
