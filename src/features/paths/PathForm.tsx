import { useCallback, useEffect, useState } from 'react'
import { pathRepository } from '../../lib/repositories'
import type { Path } from '../../types/Path'
import type { PathStatus } from '../../types/PathStatus'
import type { GameId, PathId, PlaythroughId } from '../../types/ids'

/**
 * Props for PathForm when creating a new path.
 */
export interface PathFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'

  /** Game ID the path belongs to. */
  gameId: GameId

  /** Current playthrough ID, used to initialize path status. */
  playthroughId: PlaythroughId | null

  /** Called after successful create. */
  onSaved: () => void

  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for PathForm when editing an existing path.
 */
export interface PathFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'

  /** The path to edit. */
  path: Path

  /** Current playthrough ID, used to edit path status. */
  playthroughId: PlaythroughId | null

  /** Called after successful update. */
  onSaved: () => void

  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for PathForm.
 */
export type PathFormProps = PathFormCreateProps | PathFormEditProps

/**
 * Determines the initial status for a path form.
 *
 * @param playthroughId - Current playthrough ID.
 * @param pathId - Path ID to load progress for (when editing).
 * @returns The initial status, or null if none.
 */
async function loadInitialStatus(
  playthroughId: PlaythroughId | null,
  pathId: PathId | null
): Promise<PathStatus | null> {
  if (!playthroughId || !pathId) {
    return null
  }
  const progress = await pathRepository.getProgress(playthroughId, pathId)
  return progress?.status ?? null
}

/**
 * Form to create or edit a path. In create mode requires gameId; in edit
 * mode requires the existing path. Tracks playthrough-scoped status via
 * PathProgress when a playthrough is available.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the PathForm component.
 */
export function PathForm(props: PathFormProps): JSX.Element {
  const [name, setName] = useState(props.mode === 'edit' ? props.path.name : '')
  const [description, setDescription] = useState(
    props.mode === 'edit' ? (props.path.description ?? '') : ''
  )
  const [status, setStatus] = useState<PathStatus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(
    props.mode === 'edit' && props.playthroughId !== null
  )
  const [error, setError] = useState<string | null>(null)

  // Load the initial status for the path.
  useEffect(() => {
    let cancelled = false
    async function load() {
      // If the form is in edit mode and a playthrough ID and path ID are provided, load the initial status.
      if (props.mode === 'edit' && props.playthroughId && props.path.id) {
        setIsLoadingStatus(true)
        try {
          // Load the initial status for the path.
          const initial = await loadInitialStatus(
            props.playthroughId,
            props.path.id as PathId
          )

          // If the status is not cancelled, set the status.
          if (!cancelled) {
            setStatus(initial)
          }
        } finally {
          // If the status is not cancelled, set the loading status to false.
          if (!cancelled) {
            setIsLoadingStatus(false)
          }
        }
      } else {
        // If the form is not in edit mode or a playthrough ID and path ID are not provided, set the status to null.
        setStatus(null)
      }
    }
    // Load the initial status for the path.
    load()

    // If the load is cancelled, set the cancelled flag to true.
    return () => {
      cancelled = true
    }
  }, [props])

  /**
   * Handles the submission of the path form.
   *
   * @param e - The form event to prevent default and handle submission.
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
        // If the form is in create mode, create the path.
        if (props.mode === 'create') {
          const created = await pathRepository.create({
            gameId: props.gameId,
            name: trimmedName,
            description: description.trim() || undefined,
          })

          // If the playthrough ID and status are provided, upsert the progress.
          if (props.playthroughId && status !== null) {
            await pathRepository.upsertProgress({
              playthroughId: props.playthroughId,
              pathId: created.id as PathId,
              status,
            })
          }
        } else {
          // If the form is in edit mode, update the path.
          const updated: Path = {
            ...props.path,
            name: trimmedName,
            description: description.trim() || undefined,
          }
          await pathRepository.update(updated)

          // If the playthrough ID and status are provided, upsert the progress.
          if (props.playthroughId && status !== null) {
            await pathRepository.upsertProgress({
              playthroughId: props.playthroughId,
              pathId: updated.id as PathId,
              status,
            })
          }
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save path.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, description, status, props]
  )

  const canEditStatus = props.playthroughId !== null

  return (
    // Render the form.
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Render the name input. */}
      <div>
        <label
          htmlFor="path-name"
          className="block text-sm font-medium text-slate-700"
        >
          Name
        </label>
        <input
          id="path-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Path name"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
        />
      </div>

      {/* Render the description input. */}
      <div>
        <label
          htmlFor="path-description"
          className="block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="path-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description of how this path connects places"
          rows={3}
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        />
      </div>

      {/* Render the status input. */}
      <div>
        <label
          htmlFor="path-status"
          className="block text-sm font-medium text-slate-700"
        >
          Status
        </label>
        {/* Render the status select if the user can edit the status, otherwise render a message. */}
        {canEditStatus ? (
          <select
            id="path-status"
            value={status ?? 0}
            onChange={(e) =>
              setStatus((Number(e.target.value) as PathStatus) ?? 0)
            }
            disabled={isSubmitting || isLoadingStatus}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          >
            <option value={0}>Restricted</option>
            <option value={1}>Opened</option>
            <option value={2}>Blocked</option>
          </select>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            Create a playthrough to track path status.
          </p>
        )}
      </div>

      {/* Render the error message if there is an error. */}
      {error && (
        <p id="path-form-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Render the save and cancel buttons. */}
      <div className="flex gap-2">
        {/* Render the save button. */}
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

        {/* Render the cancel button. */}
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
