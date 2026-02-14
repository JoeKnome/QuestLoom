import { useState, useEffect, useCallback } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { purgeDatabase, purgeLocalStorageSelection } from '../../lib/debug'
import { gameRepository, playthroughRepository } from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { Game } from '../../types/Game'
import { CreateGameForm } from './CreateGameForm'

type ConfirmKind = 'delete-game' | 'purge-db' | 'purge-storage'
interface ConfirmState {
  kind: ConfirmKind
  game?: Game
}

/**
 * Single screen: list of games and "New game" form.
 * Loads games from the repository on mount and after create.
 * Clicking a game sets it (and its first playthrough) as current and navigates to the game view.
 */
export function GameListScreen(): JSX.Element {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const currentGameId = useAppStore((s) => s.currentGameId)
  const setCurrentGameAndPlaythrough = useAppStore(
    (s) => s.setCurrentGameAndPlaythrough
  )

  /**
   * Loads the games from the repository.
   */
  const loadGames = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await gameRepository.getAll()
      setGames(list)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGames()
  }, [loadGames])

  /**
   * Selects a game and sets it as the current game.
   * If the game has playthroughs, sets the first playthrough as the current playthrough.
   *
   * @param gameId - The ID of the game to select
   */
  const handleSelectGame = useCallback(
    async (gameId: Game['id']) => {
      const playthroughs = await playthroughRepository.getByGameId(gameId)
      const first = playthroughs[0] ?? null
      setCurrentGameAndPlaythrough(gameId, first?.id ?? null)
    },
    [setCurrentGameAndPlaythrough]
  )

  /**
   * Opens the confirmation dialog to delete a game.
   *
   * @param e - The mouse event
   * @param game - The game to delete
   */
  const handleDeleteGameClick = useCallback(
    (e: React.MouseEvent, game: Game) => {
      e.stopPropagation()
      setConfirm({ kind: 'delete-game', game })
    },
    []
  )

  /**
   * Opens the confirmation dialog to purge the database.
   *
   * @param e - The mouse event
   */
  const handlePurgeDatabaseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirm({ kind: 'purge-db' })
  }, [])

  /**
   * Opens the confirmation dialog to purge localStorage selection.
   *
   * @param e - The mouse event
   */
  const handlePurgeLocalStorageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirm({ kind: 'purge-storage' })
  }, [])

  /**
   * Runs the confirmed destructive action and closes the dialog.
   */
  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (!confirm) return
    try {
      if (confirm.kind === 'delete-game' && confirm.game) {
        await gameRepository.delete(confirm.game.id)
        if (confirm.game.id === currentGameId) {
          setCurrentGameAndPlaythrough(null, null)
        }
        loadGames()
      } else if (confirm.kind === 'purge-db') {
        await purgeDatabase()
        setCurrentGameAndPlaythrough(null, null)
        loadGames()
      } else if (confirm.kind === 'purge-storage') {
        purgeLocalStorageSelection()
        loadGames()
      }
    } finally {
      setConfirm(null)
    }
  }, [confirm, currentGameId, setCurrentGameAndPlaythrough, loadGames])

  const handleConfirmationDialogCancel = useCallback(() => {
    setConfirm(null)
  }, [])

  const confirmConfig =
    confirm?.kind === 'delete-game'
      ? {
          message:
            'Delete this game and all its playthroughs? This cannot be undone.',
          confirmLabel: 'Delete',
          variant: 'danger' as const,
        }
      : confirm?.kind === 'purge-db'
        ? {
            message:
              'Clear all data in the local database? This cannot be undone.',
            confirmLabel: 'Purge database',
            variant: 'danger' as const,
          }
        : confirm?.kind === 'purge-storage'
          ? {
              message:
                'Clear current game/playthrough selection from localStorage?',
              confirmLabel: 'Purge localStorage',
              variant: 'default' as const,
            }
          : null

  return (
    <div className="space-y-6">
      {confirm && confirmConfig ? (
        <ConfirmDialog
          isOpen
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          cancelLabel="Cancel"
          onConfirm={handleConfirmationDialogConfirm}
          onCancel={handleConfirmationDialogCancel}
          variant={confirmConfig.variant}
        />
      ) : null}
      <section>
        <h2 className="mb-2 text-lg font-medium text-slate-800">Games</h2>
        <CreateGameForm onCreated={loadGames} />
      </section>

      <section>
        {isLoading ? (
          <p className="text-slate-500">Loading games…</p>
        ) : games.length === 0 ? (
          <p className="text-slate-600">
            No games yet. Create one above to get started.
          </p>
        ) : (
          <ul className="space-y-2" role="list">
            {games.map((game) => (
              <li key={game.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectGame(game.id)}
                  className="flex flex-1 items-center justify-between rounded border border-slate-200 bg-white px-4 py-3 text-left text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>{game.name}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteGameClick(e, game)}
                  className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  aria-label={`Delete game ${game.name}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h3 className="mb-2 text-sm font-medium text-slate-500">Debug</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePurgeDatabaseClick}
            className="rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
          >
            Purge database
          </button>
          <button
            type="button"
            onClick={handlePurgeLocalStorageClick}
            className="rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
          >
            Purge localStorage
          </button>
        </div>
      </section>
    </div>
  )
}
