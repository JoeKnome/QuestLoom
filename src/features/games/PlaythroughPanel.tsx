import { useCallback, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { playthroughRepository } from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { Playthrough } from '../../types/Playthrough'
import type { PlaythroughPanelProps } from './PlaythroughPanel.types'

/**
 * Panel to manage playthroughs for the current game: list, select, rename, create, delete.
 * Renders as a slide-out or overlay; call onClose to dismiss. Calls onPlaythroughsChange
 * after any mutation so the parent can refetch.
 */
export function PlaythroughPanel({
  gameId,
  currentPlaythroughId,
  playthroughs,
  onClose,
  onPlaythroughsChange,
}: PlaythroughPanelProps): JSX.Element {
  const setCurrentPlaythrough = useAppStore((s) => s.setCurrentPlaythrough)
  const setCurrentGameAndPlaythrough = useAppStore(
    (s) => s.setCurrentGameAndPlaythrough
  )

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteConfirmPlaythrough, setDeleteConfirmPlaythrough] =
    useState<Playthrough | null>(null)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  /**
   * Selects a playthrough and sets it as the current playthrough.
   * If the playthrough is not the current playthrough, closes the panel.
   *
   * @param id - The ID of the playthrough to select
   */
  const handleSelect = useCallback(
    (id: string) => {
      if (id !== currentPlaythroughId) {
        setCurrentPlaythrough(id as Playthrough['id'])
        onClose()
      }
    },
    [currentPlaythroughId, setCurrentPlaythrough, onClose]
  )

  /**
   * Starts the process of renaming a playthrough.
   *
   * @param p - The playthrough to rename
   */
  const startRename = useCallback((p: Playthrough) => {
    setEditingId(p.id)
    setEditingName(p.name || '')
  }, [])

  /**
   * Cancels the process of renaming a playthrough.
   */
  const cancelRename = useCallback(() => {
    setEditingId(null)
    setEditingName('')
  }, [])

  /**
   * Submits the renaming of a playthrough.
   *
   * @param p - The playthrough to rename
   */
  const submitRename = useCallback(
    async (p: Playthrough) => {
      const trimmed = editingName.trim()
      if (trimmed === (p.name || '')) {
        cancelRename()
        return
      }
      await playthroughRepository.update({ ...p, name: trimmed })
      setEditingId(null)
      setEditingName('')
      onPlaythroughsChange()
    },
    [editingName, cancelRename, onPlaythroughsChange]
  )

  /**
   * Handles the click event for deleting a playthrough.
   *
   * @param p - The playthrough to delete
   */
  const handleDeleteClick = useCallback((p: Playthrough) => {
    setDeleteConfirmPlaythrough(p)
  }, [])

  /**
   * Handles the confirmation event for deleting a playthrough.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmPlaythrough) return
    const id = deleteConfirmPlaythrough.id
    const wasCurrent = id === currentPlaythroughId
    await playthroughRepository.delete(id)
    const remaining = playthroughs.filter((p) => p.id !== id)
    if (wasCurrent) {
      if (remaining.length > 0) {
        setCurrentPlaythrough(remaining[0].id)
      } else {
        const created = await playthroughRepository.create({
          gameId,
          name: 'Default',
        })
        setCurrentGameAndPlaythrough(gameId, created.id)
      }
    }
    setDeleteConfirmPlaythrough(null)
    onPlaythroughsChange()
  }, [
    deleteConfirmPlaythrough,
    currentPlaythroughId,
    playthroughs,
    gameId,
    setCurrentPlaythrough,
    setCurrentGameAndPlaythrough,
    onPlaythroughsChange,
  ])

  /**
   * Handles the submission event for creating a new playthrough.
   *
   * @param e - The form event
   */
  const handleCreateSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = newName.trim()
      if (!trimmed) {
        setCreateError('Enter a name.')
        return
      }
      setCreateError(null)
      setIsCreating(true)
      try {
        const created = await playthroughRepository.create({
          gameId,
          name: trimmed,
        })
        setCurrentPlaythrough(created.id)
        setNewName('')
        onPlaythroughsChange()
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : 'Failed to create playthrough.'
        )
      } finally {
        setIsCreating(false)
      }
    },
    [gameId, newName, setCurrentPlaythrough, onPlaythroughsChange]
  )

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Manage playthroughs"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-lg font-medium text-slate-800">Playthroughs</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          <ul className="space-y-2" role="list">
            {playthroughs.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-1 rounded border border-slate-200 bg-slate-50/50 p-2"
              >
                {editingId === p.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void submitRename(p)
                        if (e.key === 'Escape') cancelRename()
                      }}
                      className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-slate-900"
                      autoFocus
                      aria-label="Playthrough name"
                    />
                    <button
                      type="button"
                      onClick={() => void submitRename(p)}
                      className="rounded bg-slate-700 px-2 py-1 text-sm text-white hover:bg-slate-800"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="rounded border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(p.id)}
                      className="flex-1 text-left text-slate-800 hover:text-slate-600"
                    >
                      <span>
                        {p.name || 'Unnamed playthrough'}
                        {p.id === currentPlaythroughId ? (
                          <span className="ml-2 text-xs font-medium text-slate-500">
                            (Current)
                          </span>
                        ) : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startRename(p)}
                      className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                      aria-label={`Rename ${p.name || 'playthrough'}`}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(p)}
                      className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      aria-label={`Delete ${p.name || 'playthrough'}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <form
            onSubmit={handleCreateSubmit}
            className="flex flex-col gap-2 border-t border-slate-200 pt-4"
          >
            <label
              htmlFor="new-playthrough-name"
              className="text-sm text-slate-600"
            >
              New playthrough
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <input
                id="new-playthrough-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                disabled={isCreating}
                className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
                aria-invalid={!!createError}
                aria-describedby={
                  createError ? 'new-playthrough-error' : undefined
                }
              />
              <button
                type="submit"
                disabled={isCreating}
                className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating…' : 'Create'}
              </button>
            </div>
            {createError ? (
              <p
                id="new-playthrough-error"
                className="text-sm text-red-600"
                role="alert"
              >
                {createError}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {deleteConfirmPlaythrough ? (
        <ConfirmDialog
          isOpen
          title="Delete playthrough"
          message="Delete this playthrough? Progress for this playthrough cannot be recovered."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmPlaythrough(null)}
        />
      ) : null}
    </>
  )
}
