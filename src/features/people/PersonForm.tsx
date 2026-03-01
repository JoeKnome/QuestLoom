import { useCallback, useState } from 'react'
import { LocationPlacesEditor } from '../../components/LocationPlacesEditor'
import { syncLocationThreads } from '../../lib/location'
import { personRepository } from '../../lib/repositories'
import type { GameId, PlaceId } from '../../types/ids'
import type { Person } from '../../types/Person'

/**
 * Props for PersonForm when creating a new person.
 */
export interface PersonFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the person belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for PersonForm when editing an existing person.
 */
export interface PersonFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The person to edit. */
  person: Person
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for PersonForm.
 */
export type PersonFormProps = PersonFormCreateProps | PersonFormEditProps

/**
 * Form to create or edit a person. In create mode requires gameId;
 * in edit mode requires the existing person. Uses personRepository only.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the PersonForm component.
 */
export function PersonForm(props: PersonFormProps): JSX.Element {
  const [name, setName] = useState(
    props.mode === 'edit' ? props.person.name : ''
  )
  const [notes, setNotes] = useState(
    props.mode === 'edit' ? props.person.notes : ''
  )
  const [locationPlaceIds, setLocationPlaceIds] = useState<PlaceId[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gameId = props.mode === 'create' ? props.gameId : props.person.gameId

  /**
   * Handles the submission of the person form.
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
          const person = await personRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            notes: notes.trim() || undefined,
          })
          await syncLocationThreads(props.gameId, person.id, locationPlaceIds)
        } else {
          await personRepository.update({
            ...props.person,
            name: trimmedName,
            notes: notes.trim(),
          })
          await syncLocationThreads(
            props.person.gameId,
            props.person.id,
            locationPlaceIds
          )
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save person.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, notes, locationPlaceIds, props]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="person-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="person-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'person-form-error' : undefined}
        />
      </div>
      <div>
        <label
          htmlFor="person-notes"
          className="block text-sm font-medium text-slate-700"
        >
          Notes
        </label>
        <textarea
          id="person-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          rows={3}
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>
      <LocationPlacesEditor
        gameId={gameId}
        entityId={props.mode === 'edit' ? props.person.id : undefined}
        value={locationPlaceIds}
        onChange={setLocationPlaceIds}
        disabled={isSubmitting}
      />
      {error && (
        <p id="person-form-error" className="text-sm text-red-600" role="alert">
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
