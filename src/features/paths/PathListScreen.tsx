import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntityConnections } from '../../components/EntityConnections'
import { RequirementList } from '../../components/RequirementList'
import { pathRepository } from '../../lib/repositories'
import type { Path } from '../../types/Path'
import type { GameId, PathId, PlaythroughId } from '../../types/ids'
import { PathForm } from './PathForm'

/**
 * Props for the PathListScreen component.
 */
export interface PathListScreenProps {
  /** Current game ID. */
  gameId: GameId

  /** Current playthrough ID (used for status and requirements). */
  playthroughId: PlaythroughId | null
}

/**
 * List and CRUD screen for paths in the current game.
 * Shows a list of paths with create, edit, delete, connections, and requirements.
 *
 * @param props.gameId - Game to scope the list.
 * @param props.playthroughId - Current playthrough ID.
 * @returns A JSX element representing the PathListScreen component.
 */
export function PathListScreen({
  gameId,
  playthroughId,
}: PathListScreenProps): JSX.Element {
  const [paths, setPaths] = useState<Path[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; path: Path } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<PathId | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /**
   * Loads the paths for the current game.
   */
  const loadPaths = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await pathRepository.getByGameId(gameId)
      setPaths(list)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    loadPaths()
  }, [loadPaths])

  /**
   * Handles the confirmation of deleting a path.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await pathRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadPaths()
  }, [deleteTarget, loadPaths])

  // Render the loading state if the paths are still loading.
  if (isLoading) {
    return <p className="text-slate-500">Loading paths…</p>
  }

  return (
    // Render the paths list.
    <div className="space-y-4">
      {/* Render the paths list header. */}
      <div className="flex items-center justify-between">
        {/* Render the paths list title. */}
        <h3 className="text-base font-medium text-slate-800">Paths</h3>

        {/* Render the new path button. */}
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New path
        </button>
      </div>

      {/* Render the form state if it is not null. */}
      {formState !== null ? (
        // Render the form state.
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {/* Render the create or edit form. */}
          {formState.type === 'create' ? (
            // Render the create form.
            <PathForm
              mode="create"
              gameId={gameId}
              playthroughId={playthroughId}
              onSaved={() => {
                setFormState(null)
                loadPaths()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            // Render the edit form.
            <PathForm
              mode="edit"
              path={formState.path}
              playthroughId={playthroughId}
              onSaved={() => {
                setFormState(null)
                loadPaths()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {/* Render the no paths message if there are no paths and the form state is null. */}
      {paths.length === 0 && formState === null ? (
        // Render the no paths message.
        <p className="text-slate-500">
          No paths yet. Add one to connect places.
        </p>
      ) : (
        // Render the paths list.
        <ul className="space-y-2">
          {paths.map((path) => {
            const isExpanded = expandedId === path.id
            // Render the path item.
            return (
              <li
                key={path.id}
                className="rounded border border-slate-200 bg-white px-3 py-2"
              >
                {/* Render the path item header. */}
                <div className="flex items-center justify-between">
                  {/* Render the path item name and description. */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{path.name}</p>
                    {path.description ? (
                      <p className="truncate text-sm text-slate-600">
                        {path.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Render the path item connections, edit, and delete buttons. */}
                  <div className="ml-2 flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : path.id)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                      aria-expanded={isExpanded}
                    >
                      Connections
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState({ type: 'edit', path })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(path.id as PathId)}
                      className="rounded border border-red-300 bg-white px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Render the path item connections if the path item is expanded. */}
                {isExpanded ? (
                  // Render the path item connections.
                  <div className="mt-2 space-y-2">
                    <EntityConnections
                      gameId={gameId}
                      entityId={path.id}
                      playthroughId={playthroughId}
                      entityDisplayName={path.name}
                    />
                    <RequirementList
                      gameId={gameId}
                      entityId={path.id}
                      playthroughId={playthroughId}
                      entityDisplayName={path.name}
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {/* Render the confirm dialog if the delete target is not null. */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete path"
        message="Are you sure you want to delete this path? All threads and markers connected to it will also be removed. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
