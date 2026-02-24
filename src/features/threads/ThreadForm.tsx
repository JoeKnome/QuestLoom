import { useCallback, useState } from 'react'
import { EntityPicker } from '../../components/EntityPicker'
import { threadRepository } from '../../lib/repositories'
import {
  THREAD_LABEL_OBJECTIVE_REQUIRES,
  THREAD_LABEL_REQUIRES,
} from '../../lib/repositories/threadLabels'
import {
  EntityType,
  THREAD_ENDPOINT_ENTITY_TYPES,
} from '../../types/EntityType'
import type { GameId, PlaythroughId } from '../../types/ids'
import type { Thread } from '../../types/Thread'
import { ENTITY_TYPE_LABELS } from '../../utils/entityTypeLabels'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import { STATUS_OPTIONS } from '../../utils/requirementStatusOptions'

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
  const [labelPreset, setLabelPreset] = useState<
    '' | 'requires' | 'objective_requires'
  >(() => {
    if (!isCreate) {
      if (props.thread.label === THREAD_LABEL_REQUIRES) return 'requires'
      if (props.thread.label === THREAD_LABEL_OBJECTIVE_REQUIRES)
        return 'objective_requires'
    }
    return ''
  })
  const [requirementAllowedStatuses, setRequirementAllowedStatuses] = useState<
    number[]
  >(() => (isCreate ? [] : (props.thread.requirementAllowedStatuses ?? [])))
  const [objectiveIndex, setObjectiveIndex] = useState<number>(() =>
    isCreate ? 0 : (props.thread.objectiveIndex ?? 0)
  )
  const [playthroughOnly, setPlaythroughOnly] = useState(
    isCreate ? false : Boolean(props.thread.playthroughId)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const gameId = isCreate ? props.gameId : props.thread.gameId
  const isRequirementLabel =
    labelPreset === 'requires' || labelPreset === 'objective_requires'
  const statusOptions = STATUS_OPTIONS[targetType]

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
      const resolvedLabel =
        labelPreset === 'requires'
          ? THREAD_LABEL_REQUIRES
          : labelPreset === 'objective_requires'
            ? THREAD_LABEL_OBJECTIVE_REQUIRES
            : label.trim() || undefined

      // Check if the thread is a requirement thread and playthrough-only is set,
      // and if so, set an error.
      if (isRequirementLabel && playthroughOnly) {
        setError(
          'Requirement threads must be game-level (not playthrough-only).'
        )
        return
      }

      setError(null)
      setIsSubmitting(true)
      try {
        if (isCreate) {
          await threadRepository.create({
            gameId: props.gameId,
            playthroughId: isRequirementLabel
              ? null
              : playthroughOnly
                ? (props.playthroughId ?? undefined)
                : null,
            sourceId,
            targetId,
            label: resolvedLabel ?? '',
            requirementAllowedStatuses:
              isRequirementLabel && requirementAllowedStatuses.length > 0
                ? requirementAllowedStatuses
                : undefined,
            objectiveIndex:
              labelPreset === 'objective_requires' ? objectiveIndex : undefined,
          })
        } else {
          await threadRepository.update({
            ...props.thread,
            label: resolvedLabel ?? props.thread.label,
            requirementAllowedStatuses:
              isRequirementLabel && requirementAllowedStatuses.length > 0
                ? requirementAllowedStatuses
                : undefined,
            objectiveIndex:
              labelPreset === 'objective_requires' ? objectiveIndex : undefined,
          })
        }
        props.onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save thread.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      sourceId,
      targetId,
      label,
      labelPreset,
      playthroughOnly,
      requirementAllowedStatuses,
      objectiveIndex,
      isRequirementLabel,
      isCreate,
      props,
    ]
  )

  const clearSourceId = useCallback(() => setSourceId(''), [])
  const clearTargetId = useCallback(() => setTargetId(''), [])

  /**
   * Toggles the allowed status for a requirement thread.
   *
   * @param value - The value to toggle.
   * @param checked - Whether the value is checked.
   * @returns A promise that resolves when the allowed status is toggled.
   */
  const toggleAllowedStatus = useCallback((value: number, checked: boolean) => {
    setRequirementAllowedStatuses((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    )
  }, [])

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
            <label className="block text-sm font-medium text-slate-700">
              Label
            </label>

            {/* Show label preset select. */}
            <select
              value={labelPreset}
              onChange={(e) => {
                const v = e.target.value as
                  | ''
                  | 'requires'
                  | 'objective_requires'
                setLabelPreset(v)
                if (v === '') setLabel('')
                if (v === 'requires') setLabel(THREAD_LABEL_REQUIRES)
                if (v === 'objective_requires')
                  setLabel(THREAD_LABEL_OBJECTIVE_REQUIRES)
              }}
              disabled={isSubmitting}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
            >
              <option value="">Custom (enter below)</option>
              <option value="requires">
                Requires (entity-level requirement)
              </option>
              <option value="objective_requires">
                Objective requirement (quest objective dependency)
              </option>
            </select>

            {/* Show custom label input if no preset is selected. */}
            {labelPreset === '' ? (
              <input
                id="thread-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional relationship label"
                disabled={isSubmitting}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
              />
            ) : null}
          </div>

          {/* Show allowed statuses for target if the thread is a requirement thread. */}
          {isRequirementLabel && Object.keys(statusOptions).length > 0 ? (
            <div>
              <span className="block text-sm font-medium text-slate-700">
                Allowed statuses for target (none = default for type)
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(statusOptions).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={requirementAllowedStatuses.includes(Number(key))}
                      onChange={(e) =>
                        toggleAllowedStatus(Number(key), e.target.checked)
                      }
                      disabled={isSubmitting}
                      className="rounded border-slate-300"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Show objective index input if the thread is an objective requirement thread. */}
          {labelPreset === 'objective_requires' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Objective index (0-based)
              </label>
              <input
                type="number"
                min={0}
                value={objectiveIndex}
                onChange={(e) =>
                  setObjectiveIndex(
                    Math.max(0, parseInt(e.target.value, 10) || 0)
                  )
                }
                disabled={isSubmitting}
                className="mt-1 w-24 rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-100"
              />
            </div>
          ) : null}

          {/* Show playthrough-only checkbox if the thread is not a requirement thread. */}
          {props.playthroughId && !isRequirementLabel ? (
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
        // Show edit form.
        <>
          {/* Show label preset select. */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Label preset
            </label>
            <select
              value={labelPreset}
              onChange={(e) => {
                const v = e.target.value as
                  | ''
                  | 'requires'
                  | 'objective_requires'
                setLabelPreset(v)
                setLabel(
                  v === 'requires'
                    ? THREAD_LABEL_REQUIRES
                    : v === 'objective_requires'
                      ? THREAD_LABEL_OBJECTIVE_REQUIRES
                      : props.thread.label
                )
              }}
              disabled={isSubmitting}
              className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-100"
            >
              <option value="">Custom</option>
              <option value="requires">Requires</option>
              <option value="objective_requires">Objective requirement</option>
            </select>

            {/* Show custom label input if no preset is selected. */}
            {labelPreset === '' ? (
              <input
                id="thread-label-edit"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional relationship label"
                disabled={isSubmitting}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
              />
            ) : null}
          </div>

          {/* Show allowed statuses for target if the thread is a requirement thread. */}
          {isRequirementLabel && Object.keys(statusOptions).length > 0 ? (
            <div className="mt-2">
              <span className="block text-sm font-medium text-slate-700">
                Allowed statuses for target
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(statusOptions).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={requirementAllowedStatuses.includes(Number(key))}
                      onChange={(e) =>
                        toggleAllowedStatus(Number(key), e.target.checked)
                      }
                      disabled={isSubmitting}
                      className="rounded border-slate-300"
                    />
                    {value}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {/* Show objective index input if the thread is an objective requirement thread. */}
          {labelPreset === 'objective_requires' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Objective index
              </label>
              <input
                type="number"
                min={0}
                value={objectiveIndex}
                onChange={(e) =>
                  setObjectiveIndex(
                    Math.max(0, parseInt(e.target.value, 10) || 0)
                  )
                }
                disabled={isSubmitting}
                className="mt-1 w-24 rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:bg-slate-100"
              />
            </div>
          ) : null}
        </>
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
