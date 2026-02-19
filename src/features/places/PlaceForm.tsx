import { useCallback, useState } from 'react'
import { mapRepository, placeRepository } from '../../lib/repositories'
import type { GameId, MapId } from '../../types/ids'
import type { Place } from '../../types/Place'
import { MapPicker } from '../../components/MapPicker'

/**
 * Props for PlaceForm when creating a new place.
 */
export interface PlaceFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the place belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for PlaceForm when editing an existing place.
 */
export interface PlaceFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The place to edit. */
  place: Place
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for PlaceForm.
 */
export type PlaceFormProps = PlaceFormCreateProps | PlaceFormEditProps

/**
 * Form to create or edit a place. In create mode requires gameId;
 * in edit mode requires the existing place. Uses repositories so that the map
 * picker links the place to a map via the place.map field; representative
 * threads are not created for map links.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel
 * @returns A JSX element representing the PlaceForm component.
 */
export function PlaceForm(props: PlaceFormProps): JSX.Element {
  const [name, setName] = useState(
    props.mode === 'edit' ? props.place.name : ''
  )
  const [notes, setNotes] = useState(
    props.mode === 'edit' ? props.place.notes : ''
  )
  const [mapId, setMapId] = useState<MapId | ''>(
    props.mode === 'edit' && props.place.map ? props.place.map : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles the submission of the place form.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedName = name.trim()
      if (!trimmedName) {
        setError('Enter a name.')
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        const mapValue = mapId === '' ? undefined : mapId
        if (props.mode === 'create') {
          await placeRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            notes: notes.trim() || undefined,
            map: mapValue,
          })
        } else {
          const updatedPlace: Place = {
            ...props.place,
            name: trimmedName,
            notes: notes.trim(),
            map: mapValue,
          }
          await placeRepository.update(updatedPlace)

          if (updatedPlace.map) {
            const map = await mapRepository.getById(updatedPlace.map)
            if (map && map.topLevelPlaceId === updatedPlace.id) {
              const prefix = 'Map: '
              const mapName = trimmedName.startsWith(prefix)
                ? trimmedName.slice(prefix.length)
                : trimmedName
              await mapRepository.update({
                ...map,
                name: mapName,
              })
            }
          }
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save place.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, notes, mapId, props]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="place-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="place-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Location name"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'place-form-error' : undefined}
        />
      </div>
      <div>
        <label
          htmlFor="place-map"
          className="block text-sm font-medium text-slate-700"
        >
          Map
        </label>
        <MapPicker
          id="place-map"
          gameId={props.mode === 'create' ? props.gameId : props.place.gameId}
          value={mapId}
          onChange={setMapId}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label
          htmlFor="place-notes"
          className="block text-sm font-medium text-slate-700"
        >
          Notes
        </label>
        <textarea
          id="place-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={3}
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>
      {error && (
        <p id="place-form-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving…'
            : props.mode === 'create'
              ? 'Create'
              : 'Save'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={isSubmitting}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
