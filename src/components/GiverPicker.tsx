import { useCallback, useEffect, useState } from 'react'
import { personRepository, placeRepository } from '../lib/repositories'
import type { GameId } from '../types/ids'

/**
 * Option shown in the giver picker (id + display label with type).
 */
export interface GiverOption {
  /** Entity ID (person or place). */
  id: string
  /** Display label, e.g. "Person: Alice" or "Place: Tavern". */
  label: string
}

/**
 * Props for the GiverPicker component.
 */
export interface GiverPickerProps {
  /** Game ID to load people and places from. */
  gameId: GameId
  /** Currently selected giver entity ID, or empty string for none. */
  value: string
  /** Called when the selection changes. */
  onChange: (entityId: string) => void
  /** When true, the control is disabled. */
  disabled?: boolean
  /** Optional id for the select element. */
  id?: string
  /** Optional label for the select (e.g. "Giver"). */
  'aria-label'?: string
}

/**
 * Loads people and places for the game and returns combined options with type prefix.
 */
async function loadOptions(gameId: GameId): Promise<GiverOption[]> {
  const [people, places] = await Promise.all([
    personRepository.getByGameId(gameId),
    placeRepository.getByGameId(gameId),
  ])
  const personOpts: GiverOption[] = people.map((p) => ({
    id: p.id,
    label: `Person: ${p.name}`,
  }))
  const placeOpts: GiverOption[] = places.map((p) => ({
    id: p.id,
    label: `Place: ${p.name}`,
  }))
  return [...personOpts, ...placeOpts]
}

/**
 * Dropdown that lists people and places for the given game and allows selecting one as quest giver.
 * Used by QuestForm to restrict giver to existing person or place entities.
 *
 * @param props.gameId - Game to scope entities.
 * @param props.value - Selected entity ID or ''.
 * @param props.onChange - Callback with selected entity ID.
 * @param props.disabled - Optional disabled state.
 * @param props.id - Optional id for the select.
 * @param props.aria-label - Optional accessible label.
 * @returns A JSX element representing the GiverPicker component.
 */
export function GiverPicker({
  gameId,
  value,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: GiverPickerProps): JSX.Element {
  const [options, setOptions] = useState<GiverOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    loadOptions(gameId).then((list) => {
      if (!cancelled) {
        setOptions(list)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [gameId])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  if (isLoading) {
    return (
      <select
        id={id}
        disabled
        className="mt-1 w-full rounded border border-slate-300 bg-slate-100 px-3 py-2 text-slate-500"
        aria-label={ariaLabel ?? 'Giver (loading)'}
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
      aria-label={ariaLabel ?? 'Giver'}
    >
      <option value="">Select person or place</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
