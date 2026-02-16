import { useCallback, useEffect, useState } from 'react'
import { mapRepository } from '../lib/repositories'
import type { GameId, MapId } from '../types/ids'
import type { Map } from '../types/Map'

/**
 * Props for the MapPicker component.
 */
export interface MapPickerProps {
  /** Game ID to load maps from. */
  gameId: GameId
  /** Currently selected map ID, or empty string for none. */
  value: MapId | ''
  /** Called when the selection changes. */
  onChange: (mapId: MapId | '') => void
  /** When true, the control is disabled. */
  disabled?: boolean
  /** Optional id for the select element. */
  id?: string
}

/**
 * Dropdown that lists maps for the given game and allows selecting one.
 * Used by Place form (optional map link).
 *
 * @param props.gameId - Game to scope maps.
 * @param props.value - Selected map ID or ''.
 * @param props.onChange - Callback with selected map ID or ''.
 * @param props.disabled - Optional disabled state.
 * @param props.id - Optional id for the select.
 * @returns A JSX element representing the MapPicker component.
 */
export function MapPicker({
  gameId,
  value,
  onChange,
  disabled = false,
  id,
}: MapPickerProps): JSX.Element {
  const [maps, setMaps] = useState<Map[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    mapRepository.getByGameId(gameId).then((list) => {
      if (!cancelled) {
        setMaps(list)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  /**
   * Handles the change of the selected map.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value
      onChange(v === '' ? '' : (v as MapId))
    },
    [onChange]
  )

  if (isLoading) {
    return (
      <select
        id={id}
        disabled
        className="mt-1 w-full rounded border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
        aria-label="Map (loading)"
      >
        <option value="">Loading…</option>
      </select>
    )
  }

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
      aria-label="Map"
    >
      <option value="">None</option>
      {maps.map((map) => (
        <option key={map.id} value={map.id}>
          {map.name}
        </option>
      ))}
    </select>
  )
}
