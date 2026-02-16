import { useCallback, useState } from 'react'
import { GiverPicker } from '../../components/GiverPicker'
import { questRepository, threadRepository } from '../../lib/repositories'
import { THREAD_LABEL_GIVER } from '../../lib/repositories/threadLabels'
import type { GameId } from '../../types/ids'
import type { Quest } from '../../types/Quest'
import type { QuestObjective } from '../../types/QuestObjective'

/**
 * Props for QuestForm when creating a new quest.
 */
export interface QuestFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the quest belongs to. */
  gameId: GameId
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for QuestForm when editing an existing quest.
 */
export interface QuestFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The quest to edit. */
  quest: Quest
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for QuestForm.
 */
export type QuestFormProps = QuestFormCreateProps | QuestFormEditProps

/**
 * Form to create or edit a quest. Uses questRepository only.
 * Objectives are edited as labels; completed state is playthrough-scoped (handled elsewhere).
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel
 */
export function QuestForm(props: QuestFormProps): JSX.Element {
  const [title, setTitle] = useState(
    props.mode === 'edit' ? props.quest.title : ''
  )
  const [giver, setGiver] = useState(
    props.mode === 'edit' ? props.quest.giver : ''
  )
  const [objectives, setObjectives] = useState<QuestObjective[]>(
    props.mode === 'edit' ? props.quest.objectives : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Syncs the "giver" representative thread for a quest: create/update if giver set, delete if cleared.
   */
  const syncGiverThread = useCallback(
    async (gameId: GameId, questId: string, giverValue: string) => {
      const threads = await threadRepository.getThreadsFromEntity(
        gameId,
        questId,
        null
      )
      const giverThread = threads.find((t) => t.label === THREAD_LABEL_GIVER)
      if (giverValue.trim()) {
        if (giverThread) {
          await threadRepository.update({
            ...giverThread,
            targetId: giverValue.trim(),
          })
        } else {
          await threadRepository.create({
            gameId,
            sourceId: questId,
            targetId: giverValue.trim(),
            label: THREAD_LABEL_GIVER,
          })
        }
      } else if (giverThread) {
        await threadRepository.delete(giverThread.id)
      }
    },
    []
  )

  /**
   * Handles the submission of the quest form.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedTitle = title.trim()
      if (!trimmedTitle) {
        setError('Enter a title.')
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        const giverValue = giver.trim()
        if (props.mode === 'create') {
          const quest = await questRepository.create({
            gameId: props.gameId,
            title: trimmedTitle,
            giver: giverValue,
            objectives: objectives.length > 0 ? objectives : undefined,
          })
          await syncGiverThread(props.gameId, quest.id, giverValue)
        } else {
          await syncGiverThread(props.quest.gameId, props.quest.id, giverValue)
          await questRepository.update({
            ...props.quest,
            title: trimmedTitle,
            giver: giverValue,
            objectives,
          })
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save quest.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [title, giver, objectives, props, syncGiverThread]
  )

  /**
   * Adds an objective to the quest.
   */
  const addObjective = useCallback(() => {
    setObjectives((prev) => [...prev, { label: '', completed: false }])
  }, [])

  /**
   * Updates an objective of the quest.
   */
  const updateObjective = useCallback((index: number, label: string) => {
    setObjectives((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], label }
      return next
    })
  }, [])

  /**
   * Removes an objective from the quest.
   */
  const removeObjective = useCallback((index: number) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index))
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor="quest-title"
          className="block text-sm font-medium text-slate-700"
        >
          Title
        </label>
        <input
          id="quest-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quest name"
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'quest-form-error' : undefined}
        />
      </div>
      <div>
        <label
          htmlFor="quest-giver"
          className="block text-sm font-medium text-slate-700"
        >
          Giver
        </label>
        <GiverPicker
          id="quest-giver"
          gameId={props.mode === 'create' ? props.gameId : props.quest.gameId}
          value={giver}
          onChange={setGiver}
          disabled={isSubmitting}
          aria-label="Quest giver (person or place)"
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Objectives
          </label>
          <button
            type="button"
            onClick={addObjective}
            disabled={isSubmitting}
            className="text-sm text-slate-600 hover:text-slate-800"
          >
            Add objective
          </button>
        </div>
        <ul className="mt-1 space-y-1">
          {objectives.map((obj, i) => (
            <li key={i} className="flex gap-2">
              <input
                type="text"
                value={obj.label}
                onChange={(e) => updateObjective(i, e.target.value)}
                placeholder="Objective"
                disabled={isSubmitting}
                className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => removeObjective(i)}
                disabled={isSubmitting}
                className="rounded border border-slate-300 px-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      {error && (
        <p id="quest-form-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving…'
            : props.mode === 'create'
              ? 'Create'
              : 'Save'}
        </button>
        <button
          type="button"
          onClick={props.onCancel}
          disabled={isSubmitting}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
