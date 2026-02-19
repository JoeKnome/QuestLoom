/**
 * Prefix used for the top-level place that represents a map.
 */
export const TOP_LEVEL_MAP_PLACE_PREFIX = 'Map: '

/**
 * Formats the name for a top-level place that represents a map.
 * Ensures the place name always has exactly one "Map: " prefix and
 * avoids duplicating the prefix if it is already present.
 *
 * @param mapName - The underlying map name (with or without prefix).
 * @returns The formatted place name with a single prefix.
 */
export function formatTopLevelPlaceName(mapName: string): string {
  let base = mapName.trim()
  while (base.startsWith(TOP_LEVEL_MAP_PLACE_PREFIX)) {
    base = base.slice(TOP_LEVEL_MAP_PLACE_PREFIX.length).trim()
  }

  if (!base) {
    return TOP_LEVEL_MAP_PLACE_PREFIX
  }

  return `${TOP_LEVEL_MAP_PLACE_PREFIX}${base}`
}

/**
 * Derives the map name from a top-level place name by stripping the
 * "Map: " prefix when present. If the prefix is missing, the place
 * name is returned as-is (trimmed).
 *
 * @param placeName - The place name to derive the map name from.
 * @returns The map name without the "Map: " prefix.
 */
export function deriveMapNameFromTopLevelPlaceName(placeName: string): string {
  let base = placeName.trim()
  while (base.startsWith(TOP_LEVEL_MAP_PLACE_PREFIX)) {
    const next = base.slice(TOP_LEVEL_MAP_PLACE_PREFIX.length).trim()
    if (!next) {
      break
    }
    base = next
  }
  return base
}
