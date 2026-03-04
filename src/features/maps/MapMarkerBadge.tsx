import type { EntityType } from '../../types/EntityType';
import {
  getEntityTypeColorClasses,
  getUnavailableEntityTypeColorClasses,
  getSpoilerHiddenColorClasses,
} from '../../utils/entityTypeColors';

/**
 * Props for the MapMarkerBadge component.
 */
export interface MapMarkerBadgeProps {
  /** Entity type the marker represents. */
  entityType: EntityType;

  /** Single-character label to display inside the badge. */
  initial: string;

  /** Tooltip text (full entity name). */
  title: string;

  /** False when entity is unavailable (requirements or location unreachable); greys out the badge. */
  available?: boolean;

  /** True when entity is actionable (what you can do next); adds accent ring for emphasis. */
  actionable?: boolean;

  /**
   * True when this entity is completed/resolved for visual purposes
   * (e.g. completed/abandoned quests, used/lost items, known/irrelevant
   * insights, dead persons). Completed markers are de-emphasized via lower
   * opacity.
   */
  completed?: boolean;

  /**
   * True when this entity is hidden by spoiler protection (driven by discovery
   * rules). When set, type-specific coloring is not shown so the entity type
   * is not revealed.
   */
  spoilerHidden?: boolean;
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
  completed = false,
  spoilerHidden = false,
}: MapMarkerBadgeProps): JSX.Element {
  const colorClasses = getEntityTypeColorClasses(entityType);
  const safeInitial = initial.trim()
    ? initial.trim().charAt(0).toUpperCase()
    : '?';

  const baseColorClasses = spoilerHidden
    ? getSpoilerHiddenColorClasses()
    : available
      ? colorClasses
      : getUnavailableEntityTypeColorClasses(entityType);

  // Base styling: normal markers have no ring; actionable markers add a teal ring.
  // Unavailable entities use desaturated type colors; completed entities are
  // further de-emphasized via opacity. Spoiler-hidden markers ignore
  // availability/completion styling and use a neutral grey so type is not
  // revealed.
  let opacityClass = '';
  if (!spoilerHidden) {
    if (completed) {
      opacityClass = 'opacity-60';
    }
  }

  const emphasisClasses =
    actionable && available && !spoilerHidden && !completed
      ? 'border-2 border-teal-500 shadow-lg'
      : '';

  const textColorClass = spoilerHidden
    ? 'text-slate-700'
    : available
      ? ''
      : 'text-slate-600';

  const displayedInitial = spoilerHidden ? '?' : safeInitial;

  return (
    <div
      className={`flex h-6 w-6 select-none items-center justify-center rounded-full shadow-md ${
        baseColorClasses
      } ${opacityClass} ${emphasisClasses}`}
      title={title}
      role="button"
      tabIndex={0}
      aria-label={title}
    >
      <span className={`text-xs font-semibold leading-none ${textColorClass}`}>
        {displayedInitial}
      </span>
    </div>
  );
}
