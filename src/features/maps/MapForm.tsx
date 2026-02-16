import { useCallback, useState } from 'react'
import { mapRepository } from '../../lib/repositories'
import type { GameId } from '../../types/ids'
import type { Map } from '../../types/Map'

/**
 * Props for MapForm when creating a new map.
 */
export interface MapFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the map belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for MapForm when editing an existing map.
 */
export interface MapFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The map to edit. */
  map: Map
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for MapForm.
 */
export type MapFormProps = MapFormCreateProps | MapFormEditProps

/**
 * Form to create or edit a map. Uses mapRepository only.
 * Markers are deferred for 2.4; only name and imageUrl are edited.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the MapForm component.
 */
export function MapForm(props: MapFormProps): JSX.Element {
  const [name, setName] = useState(props.mode === 'edit' ? props.map.name : '')
  const [imageUrl, setImageUrl] = useState(
    props.mode === 'edit' ? props.map.imageUrl : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handles the submission of the map form.
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
        if (props.mode === 'create') {
          await mapRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            imageUrl: imageUrl.trim() || '',
          })
        } else {
          await mapRepository.update({
            ...props.map,
            name: trimmedName,
            imageUrl: imageUrl.trim() || '',
          })
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save map.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, imageUrl, props]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="map-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="map-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Map label"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'map-form-error' : undefined}
        />
      </div>
      <div>
        <label
          htmlFor="map-imageUrl"
          className="block text-sm font-medium text-slate-700"
        >
          Image URL
        </label>
        <input
          id="map-imageUrl"
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL or blob reference to map image"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>
      {error && (
        <p id="map-form-error" className="text-sm text-red-600" role="alert">
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
