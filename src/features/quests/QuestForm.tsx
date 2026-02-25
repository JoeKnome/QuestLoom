import { useCallback, useState } from 'react'
import { EntityPicker } from '../../components/EntityPicker'
import { GiverPicker } from '../../components/GiverPicker'
import { questRepository, threadRepository } from '../../lib/repositories'
import { EntityType } from '../../types/EntityType'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { getThreadSubtype } from '../../utils/threadSubtype'
import type { GameId } from '../../types/ids'
import type { Quest } from '../../types/Quest'
import type { QuestObjective } from '../../types/QuestObjective'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import { STATUS_OPTIONS } from '../../utils/requirementStatusOptions'

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
  const [linkingObjectiveIndex, setLinkingObjectiveIndex] = useState<
    number | null
  >(null)
  const [linkEntityType, setLinkEntityType] = useState<EntityType>(
    EntityType.ITEM
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gameId = props.mode === 'create' ? props.gameId : props.quest.gameId

  /**
   * Syncs objective-dependency threads for the Loom: one thread per objective that has entityId.
   * Removes any existing objective_requires threads for this quest, then creates new ones.
   *
   * @param gameId - The game ID.
   * @param questId - The quest ID.
   * @param objectives - The objectives to sync.
   * @returns A promise that resolves when the threads are synced.
   */
  const syncObjectiveThreads = useCallback(
    async (gameId: GameId, questId: string, objectives: QuestObjective[]) => {
      const existing = await threadRepository.getThreadsFromEntity(
        gameId,
        questId,
        null
      )

      // Get all objective_requires threads to delete.
      const toDelete = existing.filter(
        (t) => getThreadSubtype(t) === ThreadSubtype.OBJECTIVE_REQUIRES
      )

      // Delete all objective_requires threads.
      await Promise.all(toDelete.map((t) => threadRepository.delete(t.id)))

      // Create new objective_requires threads for each objective that has an entityId.
      for (let i = 0; i < objectives.length; i++) {
        const obj = objectives[i]
        if (!obj.entityId) continue
        await threadRepository.create({
          gameId,
          sourceId: questId,
          targetId: obj.entityId,
          subtype: ThreadSubtype.OBJECTIVE_REQUIRES,
          objectiveIndex: i,
          requirementAllowedStatuses:
            obj.allowedStatuses && obj.allowedStatuses.length > 0
              ? obj.allowedStatuses
              : undefined,
        })
      }
    },
    []
  )

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
      const giverThread = threads.find(
        (t) => getThreadSubtype(t) === ThreadSubtype.GIVER
      )
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
            subtype: ThreadSubtype.GIVER,
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
          await syncObjectiveThreads(props.gameId, quest.id, objectives)
        } else {
          await syncGiverThread(props.quest.gameId, props.quest.id, giverValue)
          await questRepository.update({
            ...props.quest,
            title: trimmedTitle,
            giver: giverValue,
            objectives,
          })
          await syncObjectiveThreads(
            props.quest.gameId,
            props.quest.id,
            objectives
          )
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save quest.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [title, giver, objectives, props, syncGiverThread, syncObjectiveThreads]
  )

  /**
   * Adds an objective to the quest.
   */
  const addObjective = useCallback(() => {
    setObjectives((prev) => [...prev, { label: '' }])
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
  const removeObjective = useCallback(
    (index: number) => {
      setObjectives((prev) => prev.filter((_, i) => i !== index))
      if (linkingObjectiveIndex === index) setLinkingObjectiveIndex(null)
    },
    [linkingObjectiveIndex]
  )

  /**
   * Sets entity link for an objective (entityId and optional allowedStatuses).
   */
  const setObjectiveEntityLink = useCallback(
    (index: number, entityId: string, allowedStatuses?: number[]) => {
      setObjectives((prev) => {
        const next = [...prev]
        next[index] = {
          ...next[index],
          entityId: entityId || undefined,
          allowedStatuses: allowedStatuses ?? undefined,
        }
        return next
      })
      setLinkingObjectiveIndex(null)
    },
    []
  )

  /**
   * Toggles the allowed status for an objective.
   */
  const toggleObjectiveAllowedStatus = useCallback(
    (index: number, statusValue: number, checked: boolean) => {
      setObjectives((prev) => {
        const next = [...prev]
        const obj = next[index]
        const current = obj.allowedStatuses ?? []
        next[index] = {
          ...obj,
          allowedStatuses: checked
            ? [...current, statusValue]
            : current.filter((v) => v !== statusValue),
        }
        return next
      })
    },
    []
  )

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

        {/* Show objectives. */}
        <ul className="mt-1 space-y-2">
          {objectives.map((objective, index) => {
            const entityType = objective.entityId
              ? getEntityTypeFromId(objective.entityId)
              : null
            const statusOptions =
              entityType !== null ? STATUS_OPTIONS[entityType] : []
            const isLinking = linkingObjectiveIndex === index
            return (
              <li key={index} className="rounded border border-slate-200 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Show objective label. */}
                  <input
                    type="text"
                    value={objective.label}
                    onChange={(e) => updateObjective(index, e.target.value)}
                    placeholder="Objective"
                    disabled={isSubmitting}
                    className="flex-1 min-w-0 rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
                  />

                  {/* Show remove button. */}
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    disabled={isSubmitting}
                    className="rounded border border-slate-300 px-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Remove
                  </button>
                </div>

                {/* Show entity link if an entity is linked. */}
                {objective.entityId ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                    <span className="text-sm text-slate-600">
                      Linked to entity
                    </span>

                    {/* Show clear link button. */}
                    <button
                      type="button"
                      onClick={() =>
                        setObjectiveEntityLink(index, '', undefined)
                      }
                      disabled={isSubmitting}
                      className="text-sm text-slate-600 underline hover:text-slate-800"
                    >
                      Clear link
                    </button>

                    {/* Show allowed statuses if any are set. */}
                    {Object.keys(statusOptions).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500">
                          Completable when:
                        </span>
                        {Object.entries(statusOptions).map(([key, value]) => (
                          <label
                            key={key}
                            className="flex items-center gap-1 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={(
                                objective.allowedStatuses ?? []
                              ).includes(Number(key))}
                              onChange={(e) =>
                                toggleObjectiveAllowedStatus(
                                  index,
                                  Number(key),
                                  e.target.checked
                                )
                              }
                              disabled={isSubmitting}
                              className="rounded border-slate-300"
                            />
                            {value}
                          </label>
                        ))}
                        <span className="text-xs text-slate-400">
                          (none = default)
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : isLinking ? (
                  // Show entity picker and cancel button.
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                    {/* Show entity type selector. */}
                    <select
                      value={linkEntityType}
                      onChange={(e) =>
                        setLinkEntityType(Number(e.target.value) as EntityType)
                      }
                      disabled={isSubmitting}
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
                    >
                      {[
                        EntityType.QUEST,
                        EntityType.INSIGHT,
                        EntityType.ITEM,
                        EntityType.PERSON,
                      ].map((t) => (
                        <option key={t} value={t}>
                          {['Quest', 'Insight', 'Item', 'Person'][t]}
                        </option>
                      ))}
                    </select>

                    {/* Show entity picker. */}
                    <EntityPicker
                      gameId={gameId}
                      entityType={linkEntityType}
                      value=""
                      onChange={(entityId) =>
                        setObjectiveEntityLink(index, entityId, undefined)
                      }
                      disabled={isSubmitting}
                      aria-label="Entity for objective"
                    />

                    {/* Show cancel button. */}
                    <button
                      type="button"
                      onClick={() => setLinkingObjectiveIndex(null)}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // Show link to entity button.
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    {/* Show link to entity button. */}
                    <button
                      type="button"
                      onClick={() => setLinkingObjectiveIndex(index)}
                      disabled={isSubmitting}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      Link to entity
                    </button>
                  </div>
                )}
              </li>
            )
          })}
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
