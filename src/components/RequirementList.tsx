import { useCallback, useEffect, useState } from 'react'
import { RequirementForm } from './RequirementForm'
import { threadRepository } from '../lib/repositories'
import type { GameId, PlaythroughId } from '../types/ids'
import type { Thread } from '../types/Thread'
import { getEntityTypeFromId } from '../utils/parseEntityId'
import { getEntityDisplayName } from '../utils/getEntityDisplayName'
import { STATUS_OPTIONS } from '../utils/requirementStatusOptions'

/**
 * Props for the RequirementList component.
 */
export interface RequirementListProps {
  /** Current game ID. */
  gameId: GameId

  /** Entity ID that has the requirements (source of requirement threads). */
  entityId: string

  /** Optional. Passed for context; requirements are game-level only. */
  playthroughId?: PlaythroughId | null

  /** Optional heading (e.g. entity name) for the requirements block. */
  entityDisplayName?: string
}

/**
 * Renders entity-level requirement threads (subtype Requires) where the given
 * entity is the source. Shows target display name, optional allowed-status labels,
 * and Add / Edit / Delete. Used in list screens in the expanded row alongside
 * EntityConnections.
 *
 * @param props.gameId - Game to scope requirements.
 * @param props.entityId - Entity whose requirements to show (source).
 * @param props.playthroughId - Optional playthrough context.
 * @param props.entityDisplayName - Optional heading.
 * @returns A JSX element listing requirements or empty state with Add requirement.
 */
export function RequirementList({
  gameId,
  entityId,
  entityDisplayName,
}: RequirementListProps): JSX.Element {
  const [threads, setThreads] = useState<Thread[]>([])
  const [targetLabels, setTargetLabels] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; thread: Thread } | null
  >(null)

  /**
   * Loads the requirements for the entity.
   */
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await threadRepository.getRequirementThreadsFromEntity(
        gameId,
        entityId
      )
      setThreads(list)

      // Set the target labels for the requirements.
      const nextLabels: Record<string, string> = {}
      await Promise.all(
        list.map(async (t) => {
          nextLabels[t.id] = await getEntityDisplayName(t.targetId)
        })
      )
      setTargetLabels(nextLabels)
    } finally {
      setIsLoading(false)
    }
  }, [gameId, entityId])

  useEffect(() => {
    load()
  }, [load])

  /**
   * Handles the deletion of a requirement.
   *
   * @param thread - The thread to delete.
   */
  const handleDelete = useCallback(
    async (thread: Thread) => {
      await threadRepository.delete(thread.id)
      load()
    },
    [load]
  )

  /**
   * Renders the loading state.
   */
  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading requirements…</p>
  }

  /**
   * Renders the form state.
   */
  if (formState !== null) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-2">
        {/* Display the entity display name if it is set. */}
        {entityDisplayName ? (
          <p className="mb-1.5 text-xs font-medium text-slate-600">
            Requirements for {entityDisplayName}
          </p>
        ) : null}

        {/* Render the create form if the form state is in create mode. */}
        {formState.type === 'create' ? (
          <RequirementForm
            mode="create"
            gameId={gameId}
            sourceId={entityId}
            onSaved={() => {
              setFormState(null)
              load()
            }}
            onCancel={() => setFormState(null)}
          />
        ) : (
          // Render the edit form if the form state is in edit mode.
          <RequirementForm
            mode="edit"
            thread={formState.thread}
            onSaved={() => {
              setFormState(null)
              load()
            }}
            onCancel={() => setFormState(null)}
          />
        )}
      </div>
    )
  }

  /**
   * Renders the requirement list.
   */
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-2">
      {/* Display the entity display name if it is set. */}
      {entityDisplayName ? (
        <p className="mb-1.5 text-xs font-medium text-slate-600">
          Requirements for {entityDisplayName}
        </p>
      ) : null}

      {/* Render the empty state if there are no requirements. */}
      {threads.length === 0 ? (
        <p className="text-sm text-slate-500">No requirements.</p>
      ) : (
        // Render the requirement list if there are requirements.
        <ul className="space-y-1.5 text-sm text-slate-800">
          {threads.map((thread) => {
            // Get the target label for the thread.
            const targetLabel = targetLabels[thread.id] ?? thread.targetId

            // Get the target type for the thread.
            const targetType = getEntityTypeFromId(thread.targetId)

            // Get the status options for the target type.
            const statusOpts =
              targetType !== null ? STATUS_OPTIONS[targetType] : {}

            // Get the status labels for the thread.
            const statusLabels =
              thread.requirementAllowedStatuses?.length &&
              thread.requirementAllowedStatuses.length > 0
                ? thread.requirementAllowedStatuses
                    .map((v) => statusOpts[v])
                    .filter(Boolean)
                    .join(', ')
                : null

            // Render the requirement item.
            return (
              <li
                key={thread.id}
                className="flex flex-wrap items-center justify-between gap-1 rounded border border-slate-100 bg-white px-2 py-1"
              >
                <span>
                  {/* Display the target label. */}→ {targetLabel}
                  {statusLabels ? (
                    <span className="text-slate-500">
                      {/* Display the status labels. */}
                      (when: {statusLabels})
                    </span>
                  ) : null}
                </span>
                <span className="flex gap-1">
                  {/* Edit button. */}
                  <button
                    type="button"
                    onClick={() => setFormState({ type: 'edit', thread })}
                    className="text-xs text-slate-600 underline hover:text-slate-800"
                  >
                    Edit
                  </button>

                  {/* Delete button. */}
                  <button
                    type="button"
                    onClick={() => handleDelete(thread)}
                    className="text-xs text-red-600 underline hover:text-red-800"
                  >
                    Delete
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Add requirement button. */}
      <button
        type="button"
        onClick={() => setFormState({ type: 'create' })}
        className="mt-2 text-sm text-slate-600 hover:text-slate-800"
      >
        Add requirement
      </button>
    </div>
  )
}
