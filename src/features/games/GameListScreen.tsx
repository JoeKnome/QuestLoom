import { useState, useEffect, useCallback } from 'react'
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

  const handleSelectGame = useCallback(
    async (gameId: Game['id']) => {
      const playthroughs = await playthroughRepository.getByGameId(gameId)
      const first = playthroughs[0] ?? null
      setCurrentGameAndPlaythrough(gameId, first?.id ?? null)
    },
    [setCurrentGameAndPlaythrough]
  )

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
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectGame(game.id)}
                    className={`flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors ${
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
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
