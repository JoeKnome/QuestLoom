import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EntityConnections } from '../../components/EntityConnections'
import { insightRepository } from '../../lib/repositories'
import type { GameId, InsightId, PlaythroughId } from '../../types/ids'
import type { Insight } from '../../types/Insight'
import type { InsightProgress } from '../../types/InsightProgress'
import { InsightStatus } from '../../types/InsightStatus'
import { InsightForm } from './InsightForm'

/**
 * Props for the InsightListScreen component.
 */
export interface InsightListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (for progress; may be null). */
  playthroughId: PlaythroughId | null
}

const INSIGHT_STATUS_LABELS: Record<InsightStatus, string> = {
  [InsightStatus.ACTIVE]: 'Active',
  [InsightStatus.RESOLVED]: 'Resolved',
  [InsightStatus.IRRELEVANT]: 'Irrelevant',
}

/**
 * List and CRUD screen for insights in the current game.
 * When a playthrough is selected, shows and allows editing insight status (progress).
 *
 * @param props.gameId - Game to scope the list.
 * @param props.playthroughId - Playthrough for progress (status/notes).
 * @returns A JSX element representing the InsightListScreen component.
 */
export function InsightListScreen({
  gameId,
  playthroughId,
}: InsightListScreenProps): JSX.Element {
  const [insights, setInsights] = useState<Insight[]>([])
  const [progressByInsight, setProgressByInsight] = useState<
    Record<string, InsightProgress>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; insight: Insight } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<InsightId | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /**
   * Loads the insights for the current game.
   */
  const loadInsights = useCallback(async () => {
    setIsLoading(true)
    try {
      const [list, progressList] = await Promise.all([
        insightRepository.getByGameId(gameId),
        playthroughId
          ? insightRepository.getAllProgressForPlaythrough(playthroughId)
          : Promise.resolve([]),
      ])
      setInsights(list)
      const byInsight: Record<string, InsightProgress> = {}
      progressList.forEach((p) => {
        byInsight[p.insightId] = p
      })
      setProgressByInsight(byInsight)
    } finally {
      setIsLoading(false)
    }
  }, [gameId, playthroughId])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  /**
   * Handles the confirmation of deleting an insight.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await insightRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadInsights()
  }, [deleteTarget, loadInsights])

  /**
   * Handles the change of status for an insight.
   */
  const handleStatusChange = useCallback(
    async (insightId: InsightId, newStatus: InsightStatus) => {
      if (playthroughId === null) return
      const existing = progressByInsight[insightId]
      await insightRepository.upsertProgress({
        playthroughId,
        insightId,
        status: newStatus,
        notes: existing?.notes ?? '',
      })
      loadInsights()
    },
    [playthroughId, progressByInsight, loadInsights]
  )

  if (isLoading) {
    return <p className="text-slate-500">Loading insights…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">Insights</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New insight
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <InsightForm
              mode="create"
              gameId={gameId}
              onSaved={() => {
                setFormState(null)
                loadInsights()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <InsightForm
              mode="edit"
              insight={formState.insight}
              onSaved={() => {
                setFormState(null)
                loadInsights()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {insights.length === 0 && formState === null ? (
        <p className="text-slate-500">
          No insights yet. Add one to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {insights.map((insight) => {
            const progress = progressByInsight[insight.id]
            const status = progress?.status ?? InsightStatus.ACTIVE
            const isExpanded = expandedId === insight.id
            return (
              <li
                key={insight.id}
                className="rounded border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">
                      {insight.title}
                    </p>
                    <p className="truncate text-sm text-slate-600">
                      {insight.content}
                    </p>
                    {playthroughId !== null && (
                      <select
                        value={status}
                        onChange={(e) =>
                          handleStatusChange(
                            insight.id,
                            Number(e.target.value) as InsightStatus
                          )
                        }
                        className="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                        aria-label={`Status for ${insight.title}`}
                      >
                        {[
                          InsightStatus.ACTIVE,
                          InsightStatus.RESOLVED,
                          InsightStatus.IRRELEVANT,
                        ].map((s) => (
                          <option key={s} value={s}>
                            {INSIGHT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="ml-2 flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : insight.id)
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                      aria-expanded={isExpanded}
                    >
                      Connections
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState({ type: 'edit', insight })}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(insight.id)}
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
                      entityId={insight.id}
                      playthroughId={playthroughId}
                      entityDisplayName={insight.title}
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
        title="Delete insight"
        message="Are you sure you want to delete this insight? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
