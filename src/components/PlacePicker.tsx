import { useCallback, useEffect, useState } from 'react'
import { placeRepository } from '../lib/repositories'
import type { GameId, PlaceId } from '../types/ids'
import type { Place } from '../types/Place'

/**
 * Props for the PlacePicker component.
 */
export interface PlacePickerProps {
  /** Game ID to load places from. */
  gameId: GameId
  /** Currently selected place ID, or empty string for none. */
  value: PlaceId | ''
  /** Called when the selection changes. */
  onChange: (placeId: PlaceId | '') => void
  /** When true, the control is disabled. */
  disabled?: boolean
  /** Optional id for the select element. */
  id?: string
}

/**
 * Dropdown that lists places for the given game and allows selecting one.
 * Used by Item form (location) and anywhere a place must be chosen.
 *
 * @param props.gameId - Game to scope places.
 * @param props.value - Selected place ID or ''.
 * @param props.onChange - Callback with selected place ID or ''.
 * @param props.disabled - Optional disabled state.
 * @param props.id - Optional id for the select.
 * @returns A JSX element representing the PlacePicker component.
 */
export function PlacePicker({
  gameId,
  value,
  onChange,
  disabled = false,
  id,
}: PlacePickerProps): JSX.Element {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    placeRepository.getByGameId(gameId).then((list) => {
      if (!cancelled) {
        setPlaces(list)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  /**
   * Handles the change of the selected place.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value
      onChange(v === '' ? '' : (v as PlaceId))
    },
    [onChange]
  )

  if (isLoading) {
    return (
      <select
        id={id}
        disabled
        className="mt-1 w-full rounded border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
        aria-label="Place (loading)"
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
      aria-label="Place"
    >
      <option value="">Select a place</option>
      {places.map((place) => (
        <option key={place.id} value={place.id}>
          {place.name}
        </option>
      ))}
    </select>
  )
}
