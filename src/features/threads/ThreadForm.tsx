import { useCallback, useState } from 'react'
import { EntityPicker } from '../../components/EntityPicker'
import { threadRepository } from '../../lib/repositories'
import {
  EntityType,
  THREAD_ENDPOINT_ENTITY_TYPES,
} from '../../types/EntityType'
import type { GameId, PlaythroughId } from '../../types/ids'
import type { Thread } from '../../types/Thread'
import { ENTITY_TYPE_LABELS } from '../../utils/entityTypeLabels'
import { getEntityTypeFromId } from '../../utils/parseEntityId'

/**
 * Props for ThreadForm when creating a new thread.
 */
export interface ThreadFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'
  /** Game ID the thread belongs to. */
  gameId: GameId
  /** Current playthrough ID; when set, thread can be playthrough-scoped. */
  playthroughId: PlaythroughId | null
  /** Called after successful create. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for ThreadForm when editing an existing thread.
 */
export interface ThreadFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'
  /** The thread to edit. */
  thread: Thread
  /** Called after successful update. */
  onSaved: () => void
  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Represents the props for the ThreadForm component.
 */
export type ThreadFormProps = ThreadFormCreateProps | ThreadFormEditProps

/**
 * Form to create or edit a thread. Uses threadRepository and EntityPicker for source/target.
 * Create mode: source type + source entity, target type + target entity, label, optional playthrough-only.
 * Edit mode: label.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel
 * @returns A JSX element representing the ThreadForm component.
 */
export function ThreadForm(props: ThreadFormProps): JSX.Element {
  const isCreate = props.mode === 'create'
  const [sourceType, setSourceType] = useState<EntityType>(() =>
    isCreate
      ? EntityType.PERSON
      : (getEntityTypeFromId(props.thread.sourceId) ?? EntityType.PERSON)
  )
  const [sourceId, setSourceId] = useState(
    isCreate ? '' : props.thread.sourceId
  )
  const [targetType, setTargetType] = useState<EntityType>(() =>
    isCreate
      ? EntityType.PLACE
      : (getEntityTypeFromId(props.thread.targetId) ?? EntityType.PLACE)
  )
  const [targetId, setTargetId] = useState(
    isCreate ? '' : props.thread.targetId
  )
  const [label, setLabel] = useState(isCreate ? '' : props.thread.label)
  const [playthroughOnly, setPlaythroughOnly] = useState(
    isCreate ? false : Boolean(props.thread.playthroughId)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameId = isCreate ? props.gameId : props.thread.gameId

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (sourceId === '') {
        setError('Select a source entity.')
        return
      }
      if (targetId === '') {
        setError('Select a target entity.')
        return
      }
      if (sourceId === targetId) {
        setError('Source and target must be different.')
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        if (isCreate) {
          await threadRepository.create({
            gameId: props.gameId,
            playthroughId: playthroughOnly
              ? (props.playthroughId ?? undefined)
              : null,
            sourceId,
            targetId,
            label: label.trim() || undefined,
          })
        } else {
          await threadRepository.update({
            ...props.thread,
            label: label.trim(),
          })
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save thread.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [sourceId, targetId, label, playthroughOnly, isCreate, props]
  )

  const clearSourceId = useCallback(() => setSourceId(''), [])
  const clearTargetId = useCallback(() => setTargetId(''), [])

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isCreate ? (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Source type
            </label>
            <select
              value={sourceType}
              onChange={(e) => {
                setSourceType(Number(e.target.value) as EntityType)
                clearSourceId()
              }}
              disabled={isSubmitting}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            >
              {THREAD_ENDPOINT_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ENTITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Source
            </label>
            <EntityPicker
              gameId={gameId}
              entityType={sourceType}
              value={sourceId}
              onChange={setSourceId}
              disabled={isSubmitting}
              aria-label="Source entity"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Target type
            </label>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(Number(e.target.value) as EntityType)
                clearTargetId()
              }}
              disabled={isSubmitting}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            >
              {THREAD_ENDPOINT_ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ENTITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Target
            </label>
            <EntityPicker
              gameId={gameId}
              entityType={targetType}
              value={targetId}
              onChange={setTargetId}
              disabled={isSubmitting}
              aria-label="Target entity"
            />
          </div>
          <div>
            <label
              htmlFor="thread-label"
              className="block text-sm font-medium text-slate-700"
            >
              Label
            </label>
            <input
              id="thread-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional relationship label"
              disabled={isSubmitting}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            />
          </div>
          {props.playthroughId ? (
            <div className="flex items-center gap-2">
              <input
                id="thread-playthrough-only"
                type="checkbox"
                checked={playthroughOnly}
                onChange={(e) => setPlaythroughOnly(e.target.checked)}
                disabled={isSubmitting}
                className="rounded border-slate-300"
              />
              <label
                htmlFor="thread-playthrough-only"
                className="text-sm text-slate-700"
              >
                Playthrough-only (my investigation; cleared on new playthrough)
              </label>
            </div>
          ) : null}
        </>
      ) : (
        <div>
          <label
            htmlFor="thread-label-edit"
            className="block text-sm font-medium text-slate-700"
          >
            Label
          </label>
          <input
            id="thread-label-edit"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Optional relationship label"
            disabled={isSubmitting}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          />
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : isCreate ? 'Create' : 'Save'}
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
