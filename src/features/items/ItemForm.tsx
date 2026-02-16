import { useCallback, useState } from 'react'
import { itemRepository, threadRepository } from '../../lib/repositories'
import { THREAD_LABEL_LOCATION } from '../../lib/repositories/threadLabels'
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
 * Form to create or edit an item. Uses itemRepository and PlacePicker for location.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the ItemForm component.
 */
export function ItemForm(props: ItemFormProps): JSX.Element {
  const [name, setName] = useState(props.mode === 'edit' ? props.item.name : '')
  const [location, setLocation] = useState<PlaceId | ''>(
    props.mode === 'edit' ? props.item.location : ''
  )
  const [description, setDescription] = useState(
    props.mode === 'edit' ? props.item.description : ''
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameId = props.mode === 'create' ? props.gameId : props.item.gameId

  /**
   * Syncs the "location" representative thread for an item: create/update if location set, delete if cleared.
   */
  const syncLocationThread = useCallback(
    async (gId: GameId, itemId: string, placeId: string) => {
      const threads = await threadRepository.getThreadsFromEntity(
        gId,
        itemId,
        null
      )
      const locationThread = threads.find(
        (t) => t.label === THREAD_LABEL_LOCATION
      )
      if (placeId) {
        if (locationThread) {
          await threadRepository.update({
            ...locationThread,
            targetId: placeId,
          })
        } else {
          await threadRepository.create({
            gameId: gId,
            sourceId: itemId,
            targetId: placeId,
            label: THREAD_LABEL_LOCATION,
          })
        }
      } else if (locationThread) {
        await threadRepository.delete(locationThread.id)
      }
    },
    []
  )

  /**
   * Handles the submission of the item form.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedName = name.trim()
      if (!trimmedName) {
        setError('Enter a name.')
        return
      }
      if (location === '') {
        setError('Select a place (location).')
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        const placeId = location as PlaceId
        if (props.mode === 'create') {
          const item = await itemRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            location: placeId,
            description: description.trim() || undefined,
          })
          await syncLocationThread(props.gameId, item.id, placeId)
        } else {
          await syncLocationThread(props.item.gameId, props.item.id, placeId)
          await itemRepository.update({
            ...props.item,
            name: trimmedName,
            location: placeId,
            description: description.trim(),
          })
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save item.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, location, description, props, syncLocationThread]
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
        <label
          htmlFor="item-location"
          className="block text-sm font-medium text-slate-700"
        >
          Location
        </label>
        <PlacePicker
          id="item-location"
          gameId={gameId}
          value={location}
          onChange={setLocation}
          disabled={isSubmitting}
        />
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
