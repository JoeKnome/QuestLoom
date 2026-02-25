import { EntityType } from '../types/EntityType'

/**
 * Returns Tailwind classes for the background and text color of an entity type.
 * Used for small badges such as map markers; colors are chosen to be readable
 * on both light and dark map images.
 *
 * @param entityType - The entity type to style.
 * @returns A string of Tailwind classes for background and text color.
 */
export function getEntityTypeColorClasses(entityType: EntityType): string {
  switch (entityType) {
    case EntityType.QUEST:
      return 'bg-sky-600 text-white'
    case EntityType.INSIGHT:
      return 'bg-violet-600 text-white'
    case EntityType.ITEM:
      return 'bg-amber-500 text-slate-900'
    case EntityType.PERSON:
      return 'bg-emerald-600 text-white'
    case EntityType.PLACE:
      return 'bg-rose-600 text-white'
    case EntityType.PATH:
      return 'bg-teal-600 text-white'
    default:
      return 'bg-slate-600 text-white'
  }
}
