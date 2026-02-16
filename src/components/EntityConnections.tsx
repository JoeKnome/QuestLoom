import { useCallback, useEffect, useState } from 'react'
import { threadRepository } from '../lib/repositories'
import type { GameId, PlaythroughId } from '../types/ids'
import type { Thread } from '../types/Thread'
import { getEntityDisplayName } from '../utils/getEntityDisplayName'

/**
 * Props for the EntityConnections component.
 */
export interface EntityConnectionsProps {
  /** Current game ID. */
  gameId: GameId
  /** Typed entity ID (source or target of threads). */
  entityId: string
  /** Optional. Null = game-level threads only; set = game-level + that playthrough. */
  playthroughId?: PlaythroughId | null
  /** Optional heading (e.g. entity name) for the connections block. */
  entityDisplayName?: string
}

/**
 * Renders threads where the given entity is source or target, showing the other
 * endpoint's display name and the thread label. Used in list screens to show
 * "threads from this entity" when a row is expanded.
 *
 * @param props.gameId - Game to scope threads.
 * @param props.entityId - Entity whose connections to show.
 * @param props.playthroughId - Optional playthrough filter.
 * @param props.entityDisplayName - Optional heading.
 * @returns A JSX element listing connections (other end + label) or empty state.
 */
export function EntityConnections({
  gameId,
  entityId,
  playthroughId = null,
  entityDisplayName,
}: EntityConnectionsProps): JSX.Element {
  const [threads, setThreads] = useState<Thread[]>([])
  const [labels, setLabels] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Loads the threads for the given entity.
   */
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await threadRepository.getThreadsFromEntity(
        gameId,
        entityId,
        playthroughId
      )
      setThreads(list)
      const nextLabels: Record<string, string> = {}
      await Promise.all(
        list.map(async (t) => {
          const otherId = t.sourceId === entityId ? t.targetId : t.sourceId
          nextLabels[t.id] = await getEntityDisplayName(otherId)
        })
      )
      setLabels(nextLabels)
    } finally {
      setIsLoading(false)
    }
  }, [gameId, entityId, playthroughId])

  useEffect(() => {
    load()
  }, [load])

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading connections…</p>
  }

  if (threads.length === 0) {
    return <p className="text-sm text-slate-500">No connections.</p>
  }

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-2">
      {entityDisplayName ? (
        <p className="mb-1.5 text-xs font-medium text-slate-600">
          Connections from {entityDisplayName}
        </p>
      ) : null}
      <ul className="space-y-1 text-sm text-slate-800">
        {threads.map((thread) => {
          const otherLabel =
            labels[thread.id] ??
            (thread.sourceId === entityId ? thread.targetId : thread.sourceId)
          return (
            <li key={thread.id}>
              → {otherLabel}
              {thread.label ? ` (${thread.label})` : ''}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
