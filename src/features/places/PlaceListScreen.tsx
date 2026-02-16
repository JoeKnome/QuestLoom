import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntityConnections } from '../../components/EntityConnections'
import { placeRepository } from '../../lib/repositories'
import type { GameId, PlaceId } from '../../types/ids'
import type { Place } from '../../types/Place'
import { PlaceForm } from './PlaceForm'

/**
 * Props for the PlaceListScreen component.
 */
export interface PlaceListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (unused for places; kept for consistent GameViewContent interface). */
  playthroughId: string | null
}

/**
 * List and CRUD screen for places (locations) in the current game.
 * Shows a list of places with create, edit, and delete. Uses placeRepository only.
 *
 * @param props.gameId - Game to scope the list
 * @param props.playthroughId - Unused; places are game-scoped
 * @returns A JSX element representing the PlaceListScreen component.
 */
export function PlaceListScreen({
  gameId,
  playthroughId,
}: PlaceListScreenProps): JSX.Element {
  const [places, setPlaces] = useState<Place[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; place: Place } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<PlaceId | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /**
   * Loads the places for the current game.
   */
  const loadPlaces = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await placeRepository.getByGameId(gameId)
      setPlaces(list)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  /**
   * Handles the confirmation of deleting a place.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await placeRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadPlaces()
  }, [deleteTarget, loadPlaces])

  if (isLoading) {
    return <p className="text-slate-500">Loading places…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">Places</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New place
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <PlaceForm
              mode="create"
              gameId={gameId}
              onSaved={() => {
                setFormState(null)
                loadPlaces()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <PlaceForm
              mode="edit"
              place={formState.place}
              onSaved={() => {
                setFormState(null)
                loadPlaces()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {places.length === 0 && formState === null ? (
        <p className="text-slate-500">No places yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {places.map((place) => {
            const isExpanded = expandedId === place.id
            return (
              <li
                key={place.id}
                className="rounded border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{place.name}</p>
                    {place.notes ? (
                      <p className="truncate text-sm text-slate-600">
                        {place.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : place.id)
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                      aria-expanded={isExpanded}
                    >
                      Connections
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState({ type: 'edit', place })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(place.id)}
                      className="rounded border border-red-300 bg-white px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {isExpanded ? (
                  <div className="mt-2">
                    <EntityConnections
                      gameId={gameId}
                      entityId={place.id}
                      playthroughId={playthroughId}
                      entityDisplayName={place.name}
                    />
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete place"
        message="Are you sure you want to delete this place? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
