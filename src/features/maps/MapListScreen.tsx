import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { mapRepository } from '../../lib/repositories'
import type { GameId, MapId } from '../../types/ids'
import type { Map } from '../../types/Map'
import { useGameViewStore } from '../../stores/gameViewStore'
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
  const openMapView = useGameViewStore((s) => s.openMapView)

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {maps.map((map) => (
            <button
              key={map.id}
              type="button"
              onClick={() => openMapView(map.id)}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow"
            >
              <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                {map.imageUrl ? (
                  <img
                    src={map.imageUrl}
                    alt={map.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    {map.imageSourceType === 'upload' || map.imageBlobId
                      ? 'Uploaded image'
                      : 'No image'}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {map.name}
                  </p>
                  {map.imageUrl ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                      {map.imageUrl}
                    </p>
                  ) : map.imageSourceType === 'upload' || map.imageBlobId ? (
                    <p className="mt-0.5 text-xs text-slate-600">
                      Uploaded image
                    </p>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setFormState({ type: 'edit', map })
                    }}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeleteTarget(map.id)
                    }}
                    className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
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
