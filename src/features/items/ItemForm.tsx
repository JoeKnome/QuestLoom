import { useCallback, useEffect, useState } from 'react'
import { syncLocationThreads } from '../../lib/location'
import { itemRepository, placeRepository } from '../../lib/repositories'
import { getEntityLocationPlaceIds } from '../../lib/location'
import type { GameId, PlaceId } from '../../types/ids'
import type { Item } from '../../types/Item'
import { PlacePicker } from '../../components/PlacePicker'

/**
 * Props for ItemForm when creating a new item.
 */
export interface ItemFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the item belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for ItemForm when editing an existing item.
 */
export interface ItemFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The item to edit. */
  item: Item
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for ItemForm.
 */
export type ItemFormProps = ItemFormCreateProps | ItemFormEditProps

/**
 * Form to create or edit an item. Locations are managed via LOCATION threads (multiple places allowed).
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the ItemForm component.
 */
export function ItemForm(props: ItemFormProps): JSX.Element {
  const [name, setName] = useState(props.mode === 'edit' ? props.item.name : '')
  const [locationPlaceIds, setLocationPlaceIds] = useState<PlaceId[]>([])
  const [locationPickerValue, setLocationPickerValue] = useState<PlaceId | ''>(
    ''
  )
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({})
  const [description, setDescription] = useState(
    props.mode === 'edit' ? props.item.description : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameId = props.mode === 'create' ? props.gameId : props.item.gameId

  /** Load places for display names. */
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

  const editEntityId = props.mode === 'edit' ? props.item.id : null
  const editGameId = props.mode === 'edit' ? props.item.gameId : null
  /** Load existing location place IDs when editing. */
  useEffect(() => {
    if (editEntityId == null || editGameId == null) return
    let cancelled = false
    getEntityLocationPlaceIds(editGameId, editEntityId).then((ids) => {
      if (!cancelled) setLocationPlaceIds(ids)
    })
    return () => {
      cancelled = true
    }
  }, [editEntityId, editGameId])

  const addLocation = useCallback((placeId: PlaceId | '') => {
    if (!placeId) return
    setLocationPlaceIds((prev) =>
      prev.includes(placeId) ? prev : [...prev, placeId]
    )
    setLocationPickerValue('')
  }, [])

  const handleAddLocationClick = useCallback(() => {
    if (locationPickerValue) {
      addLocation(locationPickerValue)
    }
  }, [locationPickerValue, addLocation])

  const removeLocation = useCallback((placeId: PlaceId) => {
    setLocationPlaceIds((prev) => prev.filter((id) => id !== placeId))
  }, [])

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
          const item = await itemRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            description: description.trim() || undefined,
          })
          await syncLocationThreads(props.gameId, item.id, locationPlaceIds)
        } else {
          await itemRepository.update({
            ...props.item,
            name: trimmedName,
            description: description.trim(),
          })
          await syncLocationThreads(
            props.item.gameId,
            props.item.id,
            locationPlaceIds
          )
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save item.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, description, locationPlaceIds, props]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="item-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'item-form-error' : undefined}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Locations
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Places where this item can be found (optional). Add multiple if it
          appears in more than one place.
        </p>
        {locationPlaceIds.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {locationPlaceIds.map((placeId) => (
              <li
                key={placeId}
                className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
              >
                <span className="truncate" data-place-id={placeId}>
                  {placeNames[placeId] ?? placeId}
                </span>
                <button
                  type="button"
                  onClick={() => removeLocation(placeId)}
                  disabled={isSubmitting}
                  className="shrink-0 rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  aria-label={`Remove location ${placeId}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-2 flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <PlacePicker
              id="item-location-add"
              gameId={gameId}
              value={locationPickerValue}
              onChange={setLocationPickerValue}
              disabled={isSubmitting}
            />
          </div>
          <button
            type="button"
            onClick={handleAddLocationClick}
            disabled={isSubmitting || !locationPickerValue}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Add location
          </button>
        </div>
      </div>
      <div>
        <label
          htmlFor="item-description"
          className="block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          rows={2}
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>
      {error && (
        <p id="item-form-error" className="text-sm text-red-600" role="alert">
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
