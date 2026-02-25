import { useCallback, useState } from 'react'
import { EntityPicker } from './EntityPicker'
import { threadRepository } from '../lib/repositories'
import {
  EntityType,
  REQUIREMENT_TARGET_ENTITY_TYPES,
} from '../types/EntityType'
import type { GameId } from '../types/ids'
import type { Thread } from '../types/Thread'
import { ThreadSubtype } from '../types/ThreadSubtype'
import { getEntityTypeFromId } from '../utils/parseEntityId'
import { ENTITY_TYPE_LABELS } from '../utils/entityTypeLabels'
import { STATUS_OPTIONS } from '../utils/requirementStatusOptions'

/**
 * Props for RequirementForm when creating a new requirement.
 */
export interface RequirementFormCreateProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'create'

  /** Game ID the requirement thread belongs to. */
  gameId: GameId

  /** Entity ID that has the requirement (source of the thread). */
  sourceId: string

  /** Called after successful create. */
  onSaved: () => void

  /** Called when the user cancels. */
  onCancel: () => void
}

/**
 * Props for RequirementForm when editing an existing requirement.
 */
export interface RequirementFormEditProps {
  /** Whether this form is for creating (true) or editing (false). */
  mode: 'edit'

  /** The requirement thread to edit (subtype Requires). */
  thread: Thread

  /** Called after successful update. */
  onSaved: () => void
  
  /** Called when the user cancels. */
  onCancel: () => void
}

/** Union of RequirementForm props. */
export type RequirementFormProps =
  | RequirementFormCreateProps
  | RequirementFormEditProps

/**
 * Form to create or edit a single entity-level requirement (thread subtype Requires).
 * Source is fixed (the entity that has the requirement); user picks target entity
 * and optional allowed statuses. Game-level only.
 *
 * @param props - Create or edit props; onSaved and onCancel are called on success or cancel.
 * @returns A JSX element representing the RequirementForm component.
 */
export function RequirementForm(props: RequirementFormProps): JSX.Element {
  const isCreate = props.mode === 'create'
  const gameId = isCreate ? props.gameId : props.thread.gameId
  const sourceId = isCreate ? props.sourceId : props.thread.sourceId

  const [targetType, setTargetType] = useState<EntityType>(() =>
    isCreate
      ? EntityType.ITEM
      : (getEntityTypeFromId(props.thread.targetId) ?? EntityType.ITEM)
  )
  const [targetId, setTargetId] = useState(
    isCreate ? '' : props.thread.targetId
  )
  const [requirementAllowedStatuses, setRequirementAllowedStatuses] = useState<
    number[]
  >(() => (isCreate ? [] : (props.thread.requirementAllowedStatuses ?? [])))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusOptions = STATUS_OPTIONS[targetType]

  /**
   * Toggles an allowed status for the requirement.
   * 
   * @param value - The status value to toggle.
   * @param checked - Whether the status should be added or removed.
   */
  const toggleAllowedStatus = useCallback((value: number, checked: boolean) => {
    setRequirementAllowedStatuses((prev) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    )
  }, [])

  /**
   * Handles the submission of the requirement form.
   * 
   * @param e - The form event to prevent default and handle submission.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Validate that a target entity has been selected.
      if (!targetId.trim()) {
        setError('Select a target entity.')
        return
      }
      
      // Validate that the source and target are different.
      if (targetId === sourceId) {
        setError('Source and target must be different.')
        return
      }
      
      setError(null)
      setIsSubmitting(true)
      
      try {
        // Create a new requirement thread if the form is in create mode.
        if (isCreate) {
          await threadRepository.create({
            gameId,
            playthroughId: null,
            sourceId,
            targetId: targetId.trim(),
            subtype: ThreadSubtype.REQUIRES,
            requirementAllowedStatuses:
              requirementAllowedStatuses.length > 0
                ? requirementAllowedStatuses
                : undefined,
          })
        } else {
          // Update an existing requirement thread if the form is in edit mode.
          await threadRepository.update({
            ...props.thread,
            targetId: targetId.trim(),
            requirementAllowedStatuses:
              requirementAllowedStatuses.length > 0
                ? requirementAllowedStatuses
                : undefined,
          })
        }

        // Call the onSaved callback to notify the parent component that the requirement has been saved.
        props.onSaved()
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to save requirement.'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [targetId, sourceId, requirementAllowedStatuses, isCreate, gameId, props]
  )

  return (
    // Render the form with the required fields and buttons.
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Target type section. */}
      <div>
        {/* Target type label. */}
        <label
          htmlFor="requirement-target-type"
          className="block text-sm font-medium text-slate-700"
        >
          Target type
        </label>

        {/* Target type select. */}
        <select
          id="requirement-target-type"
          value={targetType}
          onChange={(e) => {
            setTargetType(Number(e.target.value) as EntityType)
            setTargetId('')
          }}
          disabled={isSubmitting}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
        >
          {REQUIREMENT_TARGET_ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ENTITY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Target entity section. */}
      <div>
        {/* Target entity label. */}
        <label
          htmlFor="requirement-target"
          className="block text-sm font-medium text-slate-700"
        >
          Target (required when)
        </label>

        {/* Target entity picker. */}
        <EntityPicker
          id="requirement-target"
          gameId={gameId}
          entityType={targetType}
          value={targetId}
          onChange={setTargetId}
          disabled={isSubmitting}
          aria-label="Target entity"
        />
      </div>

      {/* Allowed statuses section. */}
      {Object.keys(statusOptions).length > 0 ? (
        <div>
          {/* Allowed statuses label. */}
          <span className="block text-sm font-medium text-slate-700">
            Allowed statuses for target (none = default for type)
          </span>

          {/* Allowed statuses list. */}
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.entries(statusOptions).map(([key, value]) => (
              <label key={key} className="flex items-center gap-1 text-sm">

                {/* Allowed status checkbox. */}
                <input
                  type="checkbox"
                  checked={requirementAllowedStatuses.includes(Number(key))}
                  onChange={(e) =>
                    toggleAllowedStatus(Number(key), e.target.checked)
                  }
                  disabled={isSubmitting}
                  className="rounded border-slate-300"
                />

                {/* Allowed status value. */}
                {value}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* Error message. */}
      {error ? (
        <p id="requirement-form-error" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {/* Submit and cancel buttons. */}
      <div className="flex gap-2">
        {/* Submit button. */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:bg-slate-400"
        >
          {isCreate ? 'Add requirement' : 'Save'}
        </button>

        {/* Cancel button. */}
        <button
          type="button"
          onClick={props.onCancel}
          disabled={isSubmitting}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
