import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntityConnections } from '../../components/EntityConnections'
import { checkEntityAvailability } from '../../lib/requirements'
import { itemRepository, placeRepository } from '../../lib/repositories'
import type { GameId, ItemId, PlaythroughId } from '../../types/ids'
import type { Item } from '../../types/Item'
import type { ItemState } from '../../types/ItemState'
import { ItemStatus } from '../../types/ItemStatus'
import { getEntityDisplayName } from '../../utils/getEntityDisplayName'
import { ItemForm } from './ItemForm'

/**
 * Props for the ItemListScreen component.
 */
export interface ItemListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (for state; may be null). */
  playthroughId: PlaythroughId | null
}

const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  [ItemStatus.NOT_ACQUIRED]: 'Not acquired',
  [ItemStatus.ACQUIRED]: 'Acquired',
  [ItemStatus.USED]: 'Used',
  [ItemStatus.LOST]: 'Lost',
}

/**
 * List and CRUD screen for items in the current game.
 * When a playthrough is selected, shows and allows editing item state (status).
 *
 * @param props.gameId - Game to scope the list.
 * @param props.playthroughId - Playthrough for state (status/notes).
 * @returns A JSX element representing the ItemListScreen component.
 */
export function ItemListScreen({
  gameId,
  playthroughId,
}: ItemListScreenProps): JSX.Element {
  const [items, setItems] = useState<Item[]>([])
  const [placeNames, setPlaceNames] = useState<Record<string, string>>({})
  const [stateByItem, setStateByItem] = useState<Record<string, ItemState>>({})
  const [availabilityByItem, setAvailabilityByItem] = useState<
    Record<string, { available: boolean; unmetRequirementTargetIds: string[] }>
  >({})
  const [unmetRequirementNames, setUnmetRequirementNames] = useState<
    Record<string, string>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; item: Item } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<ItemId | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /**
   * Loads the items for the current game.
   */
  const loadItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const [list, places, stateList] = await Promise.all([
        itemRepository.getByGameId(gameId),
        placeRepository.getByGameId(gameId),
        playthroughId
          ? itemRepository.getAllStateForPlaythrough(playthroughId)
          : Promise.resolve([]),
      ])
      setItems(list)
      const names: Record<string, string> = {}
      places.forEach((p) => {
        names[p.id] = p.name
      })
      setPlaceNames(names)
      const byItem: Record<string, ItemState> = {}
      stateList.forEach((s) => {
        byItem[s.itemId] = s
      })
      setStateByItem(byItem)

      // Check availability of items based on current playthrough.
      if (playthroughId && list.length > 0) {
        const results = await Promise.all(
          list.map(async (item) => {
            const result = await checkEntityAvailability(
              gameId,
              playthroughId,
              item.id
            )
            return { itemId: item.id, ...result }
          })
        )

        const byItemId: Record<
          string,
          { available: boolean; unmetRequirementTargetIds: string[] }
        > = {}
        const allUnmetIds = new Set<string>()

        // Group results by item ID.
        results.forEach((r) => {
          byItemId[r.itemId] = {
            available: r.available,
            unmetRequirementTargetIds: r.unmetRequirementTargetIds,
          }
          r.unmetRequirementTargetIds.forEach((id) => allUnmetIds.add(id))
        })

        // Set availability by item ID.
        setAvailabilityByItem(byItemId)

        // Get names of unmet requirement targets.
        const nameEntries = await Promise.all(
          Array.from(allUnmetIds).map(async (id) => {
            const name = await getEntityDisplayName(id)
            return [id, name] as const
          })
        )

        // Set names of unmet requirement targets.
        setUnmetRequirementNames(Object.fromEntries(nameEntries))
      } else {
        // No playthrough selected, so no availability to check.
        setAvailabilityByItem({})
        setUnmetRequirementNames({})
      }
    } finally {
      setIsLoading(false)
    }
  }, [gameId, playthroughId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  /**
   * Handles the confirmation of deleting an item.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await itemRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadItems()
  }, [deleteTarget, loadItems])

  /**
   * Handles the change of status for an item.
   */
  const handleStatusChange = useCallback(
    async (itemId: ItemId, newStatus: ItemStatus) => {
      if (playthroughId === null) return
      const existing = stateByItem[itemId]
      await itemRepository.upsertState({
        playthroughId,
        itemId,
        status: newStatus,
        notes: existing?.notes ?? '',
      })
      loadItems()
    },
    [playthroughId, stateByItem, loadItems]
  )

  if (isLoading) {
    return <p className="text-slate-500">Loading items…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">Items</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New item
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <ItemForm
              mode="create"
              gameId={gameId}
              onSaved={() => {
                setFormState(null)
                loadItems()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <ItemForm
              mode="edit"
              item={formState.item}
              onSaved={() => {
                setFormState(null)
                loadItems()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {items.length === 0 && formState === null ? (
        <p className="text-slate-500">No items yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const state = stateByItem[item.id]
            const status = state?.status ?? ItemStatus.NOT_ACQUIRED
            const isExpanded = expandedId === item.id
            return (
              <li
                key={item.id}
                className="rounded border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Show item name and availability. */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      {playthroughId !== null &&
                        availabilityByItem[item.id]?.available === false && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                            Unavailable
                          </span>
                        )}
                    </div>

                    {/* Show unmet requirements if the item is unavailable. */}
                    {playthroughId !== null &&
                      availabilityByItem[item.id]?.available === false &&
                      availabilityByItem[item.id].unmetRequirementTargetIds
                        .length > 0 && (
                        <p className="text-sm text-slate-600">
                          Requires:{' '}
                          {availabilityByItem[item.id].unmetRequirementTargetIds
                            .map((id) => unmetRequirementNames[id] ?? id)
                            .join(', ')}
                        </p>
                      )}
                    <p className="text-sm text-slate-600">
                      Location: {placeNames[item.location] ?? item.location}
                    </p>
                    {item.description ? (
                      <p className="truncate text-sm text-slate-500">
                        {item.description}
                      </p>
                    ) : null}
                    {playthroughId !== null && (
                      <select
                        value={status}
                        onChange={(e) =>
                          handleStatusChange(
                            item.id,
                            Number(e.target.value) as ItemStatus
                          )
                        }
                        className="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                        aria-label={`Status for ${item.name}`}
                      >
                        {[
                          ItemStatus.NOT_ACQUIRED,
                          ItemStatus.ACQUIRED,
                          ItemStatus.USED,
                          ItemStatus.LOST,
                        ].map((s) => (
                          <option key={s} value={s}>
                            {ITEM_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                      aria-expanded={isExpanded}
                    >
                      Connections
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState({ type: 'edit', item })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item.id)}
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
                      entityId={item.id}
                      playthroughId={playthroughId}
                      entityDisplayName={item.name}
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
        title="Delete item"
        message="Are you sure you want to delete this item? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
