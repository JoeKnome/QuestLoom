import { EntityType } from '../types/EntityType';

/**
 * Returns Tailwind classes for the default background and text color of an
 * entity type. Used as the base color for Loom nodes, map markers, and other
 * type badges; additional visual state (availability, completion, spoiler
 * hiding) is layered on top of this base.
 *
 * @param entityType - The entity type to style.
 * @returns A string of Tailwind classes for background and text color.
 */
export function getEntityTypeColorClasses(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.QUEST:
      return 'bg-sky-600 text-white';
    case EntityType.INSIGHT:
      return 'bg-violet-600 text-white';
    case EntityType.ITEM:
      return 'bg-amber-600 text-white';
    case EntityType.PERSON:
      return 'bg-emerald-600 text-white';
    case EntityType.PLACE:
      return 'bg-rose-600 text-white';
    case EntityType.PATH:
      return 'bg-teal-600 text-white';
    default:
      return 'bg-slate-600 text-white';
  }
}

/**
 * Returns Tailwind classes for the background and text color of an entity type
 * when it is unavailable (requirements unmet or location unreachable). These
 * variants are deliberately more desaturated than the defaults so that the
 * type remains legible while visually communicating that the entity cannot
 * currently be acted on.
 *
 * @param entityType - The entity type to style in its unavailable state.
 * @returns A string of Tailwind classes for background and text color.
 */
export function getUnavailableEntityTypeColorClasses(
  entityType: EntityType
): string {
  switch (entityType) {
    case EntityType.QUEST:
      return 'bg-sky-950 text-gray-400';
    case EntityType.INSIGHT:
      return 'bg-violet-950 text-gray-400';
    case EntityType.ITEM:
      return 'bg-amber-950 text-gray-400';
    case EntityType.PERSON:
      return 'bg-emerald-950 text-gray-400';
    case EntityType.PLACE:
      return 'bg-rose-950 text-gray-400';
    case EntityType.PATH:
      return 'bg-teal-950 text-gray-400';
    default:
      return 'bg-slate-950 text-gray-400';
  }
}

/**
 * Returns Tailwind classes for entities that are hidden by spoiler protection.
 * These are intentionally neutral grey so that the underlying entity type
 * color (and therefore type) is not revealed.
 *
 * @returns A string of Tailwind classes for background and text color.
 */
export function getSpoilerHiddenColorClasses(): string {
  return 'bg-slate-300 text-slate-700';
}
