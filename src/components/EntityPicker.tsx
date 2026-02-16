import { useCallback, useEffect, useState } from 'react'
import {
  insightRepository,
  itemRepository,
  personRepository,
  placeRepository,
  questRepository,
} from '../lib/repositories'
import type { GameId } from '../types/ids'
import { EntityType } from '../types/EntityType'

/**
 * Option shown in the entity picker (id + display label).
 */
export interface EntityOption {
  /** Entity ID. */
  id: string
  /** Display label (e.g. quest title, person name). */
  label: string
}

/**
 * Props for the EntityPicker component.
 */
export interface EntityPickerProps {
  /** Game ID to load entities from. */
  gameId: GameId
  /** Type of entity to list (quest, insight, item, person, place). */
  entityType: EntityType
  /** Currently selected entity ID, or empty string for none. */
  value: string
  /** Called when the selection changes. */
  onChange: (entityId: string) => void
  /** When true, the control is disabled. */
  disabled?: boolean
  /** Optional id for the select element. */
  id?: string
  /** Optional label for the select (e.g. "Source", "Target"). */
  'aria-label'?: string
}

/**
 * Loads the options for the entity picker.
 */
async function loadOptions(
  gameId: GameId,
  entityType: EntityType
): Promise<EntityOption[]> {
  switch (entityType) {
    case EntityType.QUEST: {
      const list = await questRepository.getByGameId(gameId)
      return list.map((q) => ({ id: q.id, label: q.title }))
    }
    case EntityType.INSIGHT: {
      const list = await insightRepository.getByGameId(gameId)
      return list.map((i) => ({ id: i.id, label: i.title }))
    }
    case EntityType.ITEM: {
      const list = await itemRepository.getByGameId(gameId)
      return list.map((i) => ({ id: i.id, label: i.name }))
    }
    case EntityType.PERSON: {
      const list = await personRepository.getByGameId(gameId)
      return list.map((p) => ({ id: p.id, label: p.name }))
    }
    case EntityType.PLACE: {
      const list = await placeRepository.getByGameId(gameId)
      return list.map((p) => ({ id: p.id, label: p.name }))
    }
    default:
      return []
  }
}

/**
 * Dropdown that lists entities of the given type for the game and allows selecting one.
 * Used by Thread form for source and target. Internally calls the correct repository by EntityType.
 *
 * @param props.gameId - Game to scope entities.
 * @param props.entityType - Which entity type to list.
 * @param props.value - Selected entity ID or ''.
 * @param props.onChange - Callback with selected entity ID.
 * @param props.disabled - Optional disabled state.
 * @param props.id - Optional id for the select.
 * @param props.aria-label - Optional accessible label.
 * @returns A JSX element representing the EntityPicker component.
 */
export function EntityPicker({
  gameId,
  entityType,
  value,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: EntityPickerProps): JSX.Element {
  const [options, setOptions] = useState<EntityOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadOptions(gameId, entityType).then((list) => {
      if (!cancelled) {
        setOptions(list)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [gameId, entityType])

  /**
   * Handles the change of the selected entity.
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const typeLabel =
    entityType === EntityType.QUEST
      ? 'Quest'
      : entityType === EntityType.INSIGHT
        ? 'Insight'
        : entityType === EntityType.ITEM
          ? 'Item'
          : entityType === EntityType.PERSON
            ? 'Person'
            : 'Place'

  if (isLoading) {
    return (
      <select
        id={id}
        disabled
        className="mt-1 w-full rounded border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
        aria-label={ariaLabel ?? `${typeLabel} (loading)`}
      >
        <option value="">Loading…</option>
      </select>
    )
  }

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
      aria-label={ariaLabel ?? typeLabel}
    >
      <option value="">Select {typeLabel.toLowerCase()}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
