import { useCallback, useEffect, useState } from 'react'
import { EntityPicker } from '../../components/EntityPicker'
import { pathRepository, threadRepository } from '../../lib/repositories'
import type { Path } from '../../types/Path'
import type { PathStatus } from '../../types/PathStatus'
import type { GameId, PathId, PlaythroughId } from '../../types/ids'
import { EntityType } from '../../types/EntityType'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import type { Thread } from '../../types/Thread'
import { getEntityDisplayName } from '../../utils/getEntityDisplayName'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import { getThreadSubtype } from '../../utils/threadSubtype'

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
  const [connections, setConnections] = useState<
    { thread: Thread; placeLabel: string }[]
  >([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [newConnectionPlaceId, setNewConnectionPlaceId] = useState<string>('')

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
   * Loads existing Place–Path connections for the path (CONNECTS_PATH threads).
   *
   * @param gameId - The game ID.
   * @param pathId - The path ID.
   * @returns The connections.
   */
  const loadConnections = useCallback(
    async (gameId: GameId, pathId: PathId) => {
      setIsLoadingConnections(true)
      try {
        // Get the threads from the entity.
        const threads = await threadRepository.getThreadsFromEntity(
          gameId,
          pathId,
          null
        )

        // Create an array of path connections.
        const pathConnections: { thread: Thread; placeLabel: string }[] = []
        for (const t of threads) {
          if (getThreadSubtype(t) !== ThreadSubtype.CONNECTS_PATH) continue

          // Get the other entity ID.
          const otherId =
            t.sourceId === pathId
              ? t.targetId
              : t.targetId === pathId
                ? t.sourceId
                : null
          if (!otherId) continue

          // Get the other entity type.
          const otherType = getEntityTypeFromId(otherId)
          if (otherType !== EntityType.PLACE) continue

          // Get the other entity label.
          const label = await getEntityDisplayName(otherId)
          pathConnections.push({ thread: t, placeLabel: label })
        }

        // Set the connections.
        setConnections(pathConnections)
      } finally {
        // Set the loading connections to false.
        setIsLoadingConnections(false)
      }
    },
    []
  )

  // Load connections when editing an existing path.
  useEffect(() => {
    if (props.mode === 'edit') {
      const gameId = props.path.gameId as GameId
      const pathId = props.path.id as PathId
      void loadConnections(gameId, pathId)
    } else {
      setConnections([])
    }
  }, [props, loadConnections])

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

      {/* Render the connections input if the form is in edit mode. */}
      {props.mode === 'edit' ? (
        // Render the connections input.
        <div className="space-y-2 rounded border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs font-medium text-slate-600">
            Connections to places
          </p>

          {/* Render the loading connections message if the connections are still loading. */}
          {isLoadingConnections ? (
            <p className="text-sm text-slate-500">Loading connections…</p>
          ) : connections.length === 0 ? (
            // Render the no connections message if there are no connections.
            <p className="text-sm text-slate-500">
              No connections yet. Add places this path connects.
            </p>
          ) : (
            // Render the connections list.
            <ul className="space-y-1 text-sm text-slate-800">
              {connections.map(({ thread, placeLabel }) => (
                // Render the connection item.
                <li
                  key={thread.id}
                  className="flex items-center justify-between rounded border border-slate-100 bg-white px-2 py-1"
                >
                  {/* Render the connection place label. */}
                  <span>{placeLabel}</span>

                  {/* Render the remove connection button. */}
                  <button
                    type="button"
                    className="text-xs text-red-600 underline hover:text-red-800"
                    disabled={isSubmitting}
                    onClick={async () => {
                      // If the form is not in edit mode, return.
                      if (props.mode !== 'edit') return

                      // Delete the thread.
                      await threadRepository.delete(thread.id)

                      // Reload the connections.
                      const gameId = props.path.gameId as GameId
                      const pathId = props.path.id as PathId
                      void loadConnections(gameId, pathId)
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Render the add connection input. */}
          <div>
            {/* Render the add connection label. */}
            <label
              htmlFor="path-add-connection"
              className="block text-xs font-medium text-slate-700"
            >
              Add connection to place
            </label>

            {/* Render the entity picker for the add connection. */}
            <EntityPicker
              id="path-add-connection"
              gameId={(props as PathFormEditProps).path.gameId as GameId}
              entityType={EntityType.PLACE}
              value={newConnectionPlaceId}
              onChange={setNewConnectionPlaceId}
              disabled={isSubmitting}
              aria-label="Place to connect this path to"
            />

            {/* Render the add connection button. */}
            <button
              type="button"
              className="mt-2 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={isSubmitting || !newConnectionPlaceId}
              onClick={async () => {
                // If the new connection place ID is not set or the form is not in edit mode, return.
                if (!newConnectionPlaceId || props.mode !== 'edit') return
                const gameId = props.path.gameId as GameId
                const pathId = props.path.id as PathId

                // Create the thread.
                await threadRepository.create({
                  gameId,
                  playthroughId: null,
                  sourceId: props.path.id,
                  targetId: newConnectionPlaceId,
                  subtype: ThreadSubtype.CONNECTS_PATH,
                })

                // Reset the new connection place ID.
                setNewConnectionPlaceId('')

                // Reload the connections.
                void loadConnections(gameId, pathId)
              }}
            >
              Add connection
            </button>
          </div>
        </div>
      ) : null}

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
