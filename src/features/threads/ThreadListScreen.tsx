import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { threadRepository } from '../../lib/repositories'
import type { GameId, PlaythroughId, ThreadId } from '../../types/ids'
import type { Thread } from '../../types/Thread'
import { getEntityDisplayName } from '../../utils/getEntityDisplayName'
import { ThreadForm } from './ThreadForm'

/**
 * Props for the ThreadListScreen component.
 */
export interface ThreadListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (for playthrough-scoped threads; may be null). */
  playthroughId: PlaythroughId | null
}

/**
 * List and CRUD screen for threads in the current game.
 * Shows a list of threads (game and optionally playthrough) with create, edit, delete.
 *
 * @param props.gameId - Game to scope the list
 * @param props.playthroughId - Playthrough for playthrough-only threads
 */
export function ThreadListScreen({
  gameId,
  playthroughId,
}: ThreadListScreenProps): JSX.Element {
  const [threads, setThreads] = useState<Thread[]>([])
  const [labels, setLabels] = useState<
    Record<string, { source: string; target: string }>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; thread: Thread } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<ThreadId | null>(null)

  /**
   * Loads the threads for the current game.
   */
  const loadThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await threadRepository.getByGameId(gameId)
      setThreads(list)
      const nextLabels: Record<string, { source: string; target: string }> = {}
      await Promise.all(
        list.map(async (t) => {
          const [source, target] = await Promise.all([
            getEntityDisplayName(gameId, t.sourceType, t.sourceId),
            getEntityDisplayName(gameId, t.targetType, t.targetId),
          ])
          nextLabels[t.id] = { source, target }
        })
      )
      setLabels(nextLabels)
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    loadThreads()
  }, [loadThreads])

  /**
   * Handles the confirmation of deleting a thread.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await threadRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadThreads()
  }, [deleteTarget, loadThreads])

  if (isLoading) {
    return <p className="text-slate-500">Loading threads…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">Threads</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New thread
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <ThreadForm
              mode="create"
              gameId={gameId}
              playthroughId={playthroughId}
              onSaved={() => {
                setFormState(null)
                loadThreads()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <ThreadForm
              mode="edit"
              thread={formState.thread}
              onSaved={() => {
                setFormState(null)
                loadThreads()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {threads.length === 0 && formState === null ? (
        <p className="text-slate-500">
          No threads yet. Add one to link entities.
        </p>
      ) : (
        <ul className="space-y-2">
          {threads.map((thread) => {
            const l = labels[thread.id]
            return (
              <li
                key={thread.id}
                className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {l
                      ? `${l.source} → ${l.target}`
                      : `${thread.sourceId} → ${thread.targetId}`}
                  </p>
                  {thread.label ? (
                    <p className="text-sm text-slate-600">{thread.label}</p>
                  ) : null}
                  {thread.playthroughId ? (
                    <span className="text-xs text-slate-500">
                      Playthrough-only
                    </span>
                  ) : null}
                </div>
                <div className="ml-2 flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormState({ type: 'edit', thread })}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(thread.id)}
                    className="rounded border border-red-300 bg-white px-2 py-1 text-sm text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete thread"
        message="Are you sure you want to delete this thread? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
