import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { mapRepository } from '../../lib/repositories'
import type { GameId, MapId } from '../../types/ids'
import type { Map } from '../../types/Map'
import { MapForm } from './MapForm'

/**
 * Props for the MapListScreen component.
 */
export interface MapListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (unused for maps; kept for consistent GameViewContent interface). */
  playthroughId: string | null
}

/**
 * List and CRUD screen for maps in the current game.
 * Shows a list of maps with create, edit, and delete. Uses mapRepository only.
 *
 * @param props.gameId - Game to scope the list.
 * @param props.playthroughId - Unused; maps are game-scoped.
 * @returns A JSX element representing the MapListScreen component.
 */
export function MapListScreen({ gameId }: MapListScreenProps): JSX.Element {
  const [maps, setMaps] = useState<Map[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; map: Map } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<MapId | null>(null)

  /**
   * Loads the maps for the current game.
   */
  const loadMaps = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await mapRepository.getByGameId(gameId)
      setMaps(list)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    loadMaps()
  }, [loadMaps])

  /**
   * Handles the confirmation of deleting a map.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await mapRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadMaps()
  }, [deleteTarget, loadMaps])

  if (isLoading) {
    return <p className="text-slate-500">Loading maps…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">Maps</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New map
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <MapForm
              mode="create"
              gameId={gameId}
              onSaved={() => {
                setFormState(null)
                loadMaps()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <MapForm
              mode="edit"
              map={formState.map}
              onSaved={() => {
                setFormState(null)
                loadMaps()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {maps.length === 0 && formState === null ? (
        <p className="text-slate-500">No maps yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {maps.map((map) => (
            <li
              key={map.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{map.name}</p>
                {map.imageUrl ? (
                  <p className="truncate text-sm text-slate-600">
                    {map.imageUrl}
                  </p>
                ) : null}
              </div>
              <div className="ml-2 flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => setFormState({ type: 'edit', map })}
                  className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(map.id)}
                  className="rounded border border-red-300 bg-white px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete map"
        message="Are you sure you want to delete this map? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
