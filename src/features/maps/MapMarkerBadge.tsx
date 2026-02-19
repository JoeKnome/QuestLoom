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
}: MapMarkerBadgeProps): JSX.Element {
  const colorClasses = getEntityTypeColorClasses(entityType)
  const safeInitial = initial.trim()
    ? initial.trim().charAt(0).toUpperCase()
    : '?'

  return (
    <div
      className={`flex h-6 w-6 select-none items-center justify-center rounded-full border border-white shadow-md ${colorClasses}`}
      title={title}
      role="button"
      tabIndex={0}
      aria-label={title}
    >
      <span className="text-xs font-semibold leading-none">{safeInitial}</span>
    </div>
  )
}
