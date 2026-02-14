import { useState, useEffect, useCallback } from 'react'
import { purgeDatabase, purgeLocalStorageSelection } from '../../lib/debug'
import { gameRepository, playthroughRepository } from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { Game } from '../../types/Game'
import { CreateGameForm } from './CreateGameForm'

/**
 * Single screen: list of games and "New game" form.
 * Loads games from the repository on mount and after create; shows current game badge.
 * Clicking a game sets it (and its first playthrough) as current.
 */
export function GameListScreen(): JSX.Element {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
   * Deletes a game and all its playthroughs.
   * Prompts for confirmation before deleting.
   * If the game is the current game, sets the current game and playthrough to null.
   * Reloads the games list.
   *
   * @param e - The mouse event
   * @param game - The game to delete
   */
  const handleDeleteGame = useCallback(
    async (e: React.MouseEvent, game: Game) => {
      e.stopPropagation()
      if (
        !window.confirm(
          'Delete this game and all its playthroughs? This cannot be undone.'
        )
      ) {
        return
      }
      await gameRepository.delete(game.id)
      if (game.id === currentGameId) {
        setCurrentGameAndPlaythrough(null, null)
      }
      loadGames()
    },
    [currentGameId, setCurrentGameAndPlaythrough, loadGames]
  )

  /**
   * Purges the local database.
   * Prompts for confirmation before purging.
   * Reloads the games list.
   *
   * @param e - The mouse event
   */
  const handlePurgeDatabase = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (
        !window.confirm(
          'Clear all data in the local database? This cannot be undone.'
        )
      ) {
        return
      }
      await purgeDatabase()
      setCurrentGameAndPlaythrough(null, null)
      loadGames()
    },
    [setCurrentGameAndPlaythrough, loadGames]
  )

  /**
   * Purges the local storage values for the current game and playthrough.
   * Prompts for confirmation before purging.
   * Reloads the games list.
   *
   * @param e - The mouse event
   */
  const handlePurgeLocalStorage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (
      !window.confirm(
        'Clear current game/playthrough selection from localStorage?'
      )
    ) {
      return
    }
    purgeLocalStorageSelection()
    loadGames()
  }, [loadGames])

  return (
    <div className="space-y-6">
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
            {games.map((game) => {
              const isCurrent = game.id === currentGameId
              return (
                <li key={game.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectGame(game.id)}
                    className={`flex flex-1 items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
                      isCurrent
                        ? 'border-slate-400 bg-slate-100 font-medium text-slate-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{game.name}</span>
                    {isCurrent && (
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs font-medium text-white">
                        Current
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteGame(e, game)}
                    className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Delete game ${game.name}`}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="border-t border-slate-200 pt-6">
        <h3 className="mb-2 text-sm font-medium text-slate-500">Debug</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePurgeDatabase}
            className="rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
          >
            Purge database
          </button>
          <button
            type="button"
            onClick={handlePurgeLocalStorage}
            className="rounded border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200"
          >
            Purge localStorage
          </button>
        </div>
      </section>
    </div>
  )
}
