import { useEffect, useRef, useState } from 'react'
import { getEntityLocationPlaceIds } from '../lib/location'
import { placeRepository } from '../lib/repositories'
import type { GameId, PlaceId } from '../types/ids'
import { PlacePicker } from './PlacePicker'

/**
 * Props for the LocationPlacesEditor component.
 * Use for any entity that can be "located at" one or more places (LOCATION threads).
 */
export interface LocationPlacesEditorProps {
  /** Current game ID. */
  gameId: GameId

  /** Entity ID when editing (load existing LOCATION threads); omit in create mode. */
  entityId?: string

  /** Current list of place IDs (controlled). */
  value: PlaceId[]

  /** Called when the user adds or removes places. */
  onChange: (placeIds: PlaceId[]) => void

  /** Whether the control is disabled. */
  disabled?: boolean
}

/**
 * Reusable editor for "Locations" (LOCATION threads to places).
 * Shows a list of places with add/remove; syncs to LOCATION threads on save (parent responsibility).
 *
 * @param props - Game, optional entityId for loading, value/onChange, disabled.
 * @returns A JSX element representing the LocationPlacesEditor component.
 */
export function LocationPlacesEditor({
  gameId,
  entityId,
  value,
  onChange,
  disabled = false,
}: LocationPlacesEditorProps): JSX.Element {
  const [pickerValue, setPickerValue] = useState<PlaceId | ''>('')
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({})
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  /**
   * Loads the names of the places for the game.
   */
  useEffect(() => {
    let cancelled = false
    placeRepository.getByGameId(gameId).then((places) => {
      if (!cancelled) {
        const names: Record<string, string> = {}
        places.forEach((p) => {
          names[p.id] = p.name
        })
        setPlaceNames(names)
      }
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  /**
   * Loads the location places for the entity when editing.
   * Uses a ref for onChange so this effect does not re-run when the parent
   * recreates its callbacks (e.g. handleSubmit), avoiding unnecessary re-loads
   * and overwriting user edits.
   */
  useEffect(() => {
    if (entityId == null || entityId === '') return
    let cancelled = false
    setIsLoadingLocations(true)
    getEntityLocationPlaceIds(gameId, entityId).then((ids) => {
      if (!cancelled) {
        onChangeRef.current(ids)
        setIsLoadingLocations(false)
      }
    })
    return () => {
      cancelled = true
      setIsLoadingLocations(false)
    }
  }, [gameId, entityId])

  /**
   * Adds a place to the entity.
   */
  const addPlace = (placeId: PlaceId | '') => {
    if (!placeId || value.includes(placeId)) return
    onChange([...value, placeId])
    setPickerValue('')
  }

  /**
   * Removes a place from the entity.
   */
  const removePlace = (placeId: PlaceId) => {
    onChange(value.filter((id) => id !== placeId))
  }

  /**
   * Renders the LocationPlacesEditor component.
   */
  return (
    <div>
      {/* Locations label */}
      <label className="block text-sm font-medium text-slate-700">
        Locations
      </label>

      {/* Locations description */}
      <p className="mt-1 text-xs text-slate-500">
        Places where this can be found (optional). Add multiple if it appears in
        more than one place.
      </p>

      {/* Locations list */}
      {isLoadingLocations && value.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Loading locations…</p>
      ) : value.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {value.map((placeId) => (
            <li
              key={placeId}
              className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
            >
              <span className="truncate">{placeNames[placeId] ?? placeId}</span>
              <button
                type="button"
                onClick={() => removePlace(placeId)}
                disabled={disabled}
                className="shrink-0 rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                aria-label={`Remove location ${placeNames[placeId] ?? placeId}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Add location button */}
      <div className="mt-2 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <PlacePicker
            id="location-places-add"
            gameId={gameId}
            value={pickerValue}
            onChange={setPickerValue}
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          onClick={() => pickerValue && addPlace(pickerValue)}
          disabled={disabled || !pickerValue}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Add location
        </button>
      </div>
    </div>
  )
}
