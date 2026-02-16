import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { questRepository } from '../../lib/repositories'
import type { GameId, PlaythroughId, QuestId } from '../../types/ids'
import type { Quest } from '../../types/Quest'
import type { QuestProgress } from '../../types/QuestProgress'
import { QuestStatus } from '../../types/QuestStatus'
import { getGiverDisplayName } from '../../utils/getEntityDisplayName'
import { QuestForm } from './QuestForm'

/**
 * Props for the QuestListScreen component.
 */
export interface QuestListScreenProps {
  /** Current game ID. */
  gameId: GameId
  /** Current playthrough ID (for progress; may be null). */
  playthroughId: PlaythroughId | null
}

const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  [QuestStatus.ACTIVE]: 'Active',
  [QuestStatus.COMPLETED]: 'Completed',
  [QuestStatus.BLOCKED]: 'Blocked',
}

/**
 * List and CRUD screen for quests in the current game.
 * Shows a list of quests with create, edit, and delete. When a playthrough is selected,
 * shows and allows editing quest status (progress) per playthrough.
 *
 * @param props.gameId - Game to scope the list
 * @param props.playthroughId - Playthrough for progress (status/notes)
 */
export function QuestListScreen({
  gameId,
  playthroughId,
}: QuestListScreenProps): JSX.Element {
  const [quests, setQuests] = useState<Quest[]>([])
  const [giverNames, setGiverNames] = useState<Record<string, string>>({})
  const [progressByQuest, setProgressByQuest] = useState<
    Record<string, QuestProgress>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [formState, setFormState] = useState<
    { type: 'create' } | { type: 'edit'; quest: Quest } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<QuestId | null>(null)

  /**
   * Loads the quests for the current game.
   */
  const loadQuests = useCallback(async () => {
    setIsLoading(true)
    try {
      const [list, progressList] = await Promise.all([
        questRepository.getByGameId(gameId),
        playthroughId
          ? questRepository.getAllProgressForPlaythrough(playthroughId)
          : Promise.resolve([]),
      ])
      setQuests(list)
      const byQuest: Record<string, QuestProgress> = {}
      progressList.forEach((p) => {
        byQuest[p.questId] = p
      })
      setProgressByQuest(byQuest)
      const names = await Promise.all(
        list.map(async (q) => ({
          id: q.id,
          name: q.giver
            ? await getGiverDisplayName(gameId, q.giver)
            : '',
        }))
      )
      setGiverNames(
        Object.fromEntries(names.map(({ id, name }) => [id, name]))
      )
    } finally {
      setIsLoading(false)
    }
  }, [gameId, playthroughId])

  useEffect(() => {
    loadQuests()
  }, [loadQuests])

  /**
   * Handles the confirmation of deleting a quest.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget === null) return
    await questRepository.delete(deleteTarget)
    setDeleteTarget(null)
    loadQuests()
  }, [deleteTarget, loadQuests])

  /**
   * Handles the change of status for a quest.
   */
  const handleStatusChange = useCallback(
    async (questId: QuestId, newStatus: QuestStatus) => {
      if (playthroughId === null) return
      const existing = progressByQuest[questId]
      await questRepository.upsertProgress({
        playthroughId,
        questId,
        status: newStatus,
        notes: existing?.notes ?? '',
      })
      loadQuests()
    },
    [playthroughId, progressByQuest, loadQuests]
  )

  if (isLoading) {
    return <p className="text-slate-500">Loading quests…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-slate-800">Quests</h3>
        <button
          type="button"
          onClick={() => setFormState({ type: 'create' })}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          New quest
        </button>
      </div>

      {formState !== null ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          {formState.type === 'create' ? (
            <QuestForm
              mode="create"
              gameId={gameId}
              onSaved={() => {
                setFormState(null)
                loadQuests()
              }}
              onCancel={() => setFormState(null)}
            />
          ) : (
            <QuestForm
              mode="edit"
              quest={formState.quest}
              onSaved={() => {
                setFormState(null)
                loadQuests()
              }}
              onCancel={() => setFormState(null)}
            />
          )}
        </div>
      ) : null}

      {quests.length === 0 && formState === null ? (
        <p className="text-slate-500">No quests yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {quests.map((quest) => {
            const progress = progressByQuest[quest.id]
            const status = progress?.status ?? QuestStatus.ACTIVE
            return (
              <li
                key={quest.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 bg-white px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{quest.title}</p>
                  <p className="text-sm text-slate-600">
                    Giver: {(giverNames[quest.id] ?? '').trim() || '—'}
                  </p>
                  {playthroughId !== null && (
                    <select
                      value={status}
                      onChange={(e) =>
                        handleStatusChange(
                          quest.id,
                          Number(e.target.value) as QuestStatus
                        )
                      }
                      className="mt-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                      aria-label={`Status for ${quest.title}`}
                    >
                      {[
                        QuestStatus.ACTIVE,
                        QuestStatus.COMPLETED,
                        QuestStatus.BLOCKED,
                      ].map((s) => (
                        <option key={s} value={s}>
                          {QUEST_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="ml-2 flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setFormState({ type: 'edit', quest })}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(quest.id)}
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
        title="Delete quest"
        message="Are you sure you want to delete this quest? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
