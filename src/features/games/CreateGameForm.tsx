import { useState, useCallback } from 'react'
import { gameRepository, playthroughRepository } from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { CreateGameFormProps } from './CreateGameForm.types'

/**
 * Form to create a new game and default playthrough, then set both as current.
 * Calls onCreated after success so the parent can refresh the game list.
 *
 * @param props.onCreated - Callback invoked after a game (and playthrough) are created and set as current
 */
export function CreateGameForm({ onCreated }: CreateGameFormProps): JSX.Element {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setCurrentGameAndPlaythrough = useAppStore(
    (s) => s.setCurrentGameAndPlaythrough
  )

  /**
   * Handles the form submission.
   *
   * @param e - The form event
   * @returns A promise that resolves when the submission is complete.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed) {
        setError('Enter a game name.')
        return
      }
      setError(null)
      setIsSubmitting(true)
      try {
        const game = await gameRepository.create({ name: trimmed })
        const playthrough = await playthroughRepository.create({
          gameId: game.id,
          name: 'Default',
        })
        setCurrentGameAndPlaythrough(game.id, playthrough.id)
        setName('')
        onCreated?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create game.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, onCreated, setCurrentGameAndPlaythrough]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label htmlFor="game-name" className="sr-only">
          Game name
        </label>
        <input
          id="game-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Game name"
          disabled={isSubmitting}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100"
          aria-invalid={error !== null}
          aria-describedby={error ? 'game-name-error' : undefined}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-slate-800 px-4 py-2 font-medium text-white shadow-sm hover:bg-slate-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'New game'}
        </button>
      </div>
      {error && (
        <p id="game-name-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
