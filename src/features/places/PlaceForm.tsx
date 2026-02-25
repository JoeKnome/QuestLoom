import { useCallback, useEffect, useRef, useState } from 'react'
import {
  mapRepository,
  placeRepository,
  threadRepository,
} from '../../lib/repositories'
import type { GameId, MapId } from '../../types/ids'
import type { Place } from '../../types/Place'
import { MapPicker } from '../../components/MapPicker'
import {
  deriveMapNameFromTopLevelPlaceName,
  formatTopLevelPlaceName,
} from '../../utils/mapNames'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { getThreadSubtype } from '../../utils/threadSubtype'

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
  const [isTopLevelPlaceForMap, setIsTopLevelPlaceForMap] = useState(false)
  const hasInitializedTopLevelNameRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (props.mode === 'edit' && props.place.map) {
        const map = await mapRepository.getById(props.place.map)
        if (!cancelled) {
          const isTopLevel = Boolean(
            map && map.topLevelPlaceId === props.place.id
          )
          setIsTopLevelPlaceForMap(isTopLevel)
          if (isTopLevel && !hasInitializedTopLevelNameRef.current) {
            hasInitializedTopLevelNameRef.current = true
            setName(deriveMapNameFromTopLevelPlaceName(props.place.name))
          }
        }
      } else if (!cancelled) {
        setIsTopLevelPlaceForMap(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [props])

  /**
   * Syncs the representative map thread for a place: ensures there is a single
   * Place → top-level Place thread (label "map") when the place has a map,
   * and removes any such threads when the map is cleared.
   */
  const syncMapRepresentativeThread = useCallback(
    async (gameId: GameId, placeId: string, mapValue: MapId | undefined) => {
      const existing = await threadRepository.getThreadsFromEntity(
        gameId,
        placeId,
        null
      )
      const mapThreads = existing.filter(
        (t) => getThreadSubtype(t) === ThreadSubtype.MAP
      )
      await Promise.all(mapThreads.map((t) => threadRepository.delete(t.id)))

      if (!mapValue) {
        return
      }

      const map = await mapRepository.getById(mapValue)
      if (!map || !map.topLevelPlaceId || map.topLevelPlaceId === placeId) {
        return
      }

      await threadRepository.create({
        gameId,
        sourceId: placeId,
        targetId: map.topLevelPlaceId,
        subtype: ThreadSubtype.MAP,
      })
    },
    []
  )

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
          const created = await placeRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            notes: notes.trim() || undefined,
            map: mapValue,
          })
          if (mapValue) {
            await syncMapRepresentativeThread(
              props.gameId,
              created.id,
              mapValue
            )
          }
        } else {
          const existingMapId = props.place.map
          const map =
            existingMapId != null
              ? await mapRepository.getById(existingMapId)
              : null
          const isTopLevel =
            map != null && map.topLevelPlaceId === props.place.id

          const effectivePlaceName = isTopLevel
            ? formatTopLevelPlaceName(trimmedName)
            : trimmedName

          const updatedPlace: Place = {
            ...props.place,
            name: effectivePlaceName,
            notes: notes.trim(),
            map: isTopLevel ? existingMapId : mapValue,
          }
          await placeRepository.update(updatedPlace)

          if (!isTopLevel) {
            await syncMapRepresentativeThread(
              updatedPlace.gameId,
              updatedPlace.id,
              mapValue
            )
          }

          if (isTopLevel && map) {
            const mapName =
              deriveMapNameFromTopLevelPlaceName(effectivePlaceName)
            await mapRepository.update({
              ...map,
              name: mapName,
            })
          }
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save place.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, notes, mapId, props, syncMapRepresentativeThread]
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
          disabled={
            isSubmitting || (props.mode === 'edit' && isTopLevelPlaceForMap)
          }
          title={
            props.mode === 'edit' && isTopLevelPlaceForMap
              ? 'This place is the top-level representation of its map.'
              : undefined
          }
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
