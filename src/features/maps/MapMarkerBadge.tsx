import type { EntityType } from '../../types/EntityType'
import { getEntityTypeColorClasses } from '../../utils/entityTypeColors'

/**
 * Props for the MapMarkerBadge component.
 */
export interface MapMarkerBadgeProps {
  /** Entity type the marker represents. */
  entityType: EntityType

  /** Single-character label to display inside the badge. */
  initial: string

  /** Tooltip text (full entity name). */
  title: string

  /** False when entity is unavailable (requirements or location unreachable); greys out the badge. */
  available?: boolean

  /** True when entity is actionable (what you can do next); adds accent ring for emphasis. */
  actionable?: boolean
}

/**
 * Small circular badge used to render a marker on a map.
 * Color is derived from entity type; shows a single-character initial and
 * exposes the full name via the native title tooltip.
 *
 * @param props - Marker badge props.
 * @returns A JSX element representing the MapMarkerBadge component.
 */
export function MapMarkerBadge({
  entityType,
  initial,
  title,
  available = true,
  actionable = false,
}: MapMarkerBadgeProps): JSX.Element {
  const colorClasses = getEntityTypeColorClasses(entityType)
  const safeInitial = initial.trim()
    ? initial.trim().charAt(0).toUpperCase()
    : '?'

  const baseClasses = available
    ? `border-white ${colorClasses}`
    : 'border-slate-300 bg-slate-300 opacity-60'

  const emphasisClasses =
    actionable && available
      ? 'ring-2 ring-teal-500 border-teal-500 shadow-lg'
      : ''

  return (
    <div
      className={`flex h-6 w-6 select-none items-center justify-center rounded-full border shadow-md ${
        baseClasses
      } ${emphasisClasses}`}
      title={title}
      role="button"
      tabIndex={0}
      aria-label={title}
    >
      <span
        className={`text-xs font-semibold leading-none ${
          available ? '' : 'text-slate-600'
        }`}
      >
        {safeInitial}
      </span>
    </div>
  )
}
