import { useEffect, useState } from 'react'
import { gameRepository, playthroughRepository } from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { Game } from '../../types/Game'
import type { Playthrough } from '../../types/Playthrough'

/**
 * Game view screen shown when a game is set as current.
 * Displays the current game name and current playthrough name.
 * If the game no longer exists (e.g. deleted elsewhere), clears selection
 * so the app returns to the game list. If the game exists but the current
 * playthrough is missing, shows the game name and "No playthrough."
 */
export function GameView(): JSX.Element {
  const currentGameId = useAppStore((s) => s.currentGameId)
  const currentPlaythroughId = useAppStore((s) => s.currentPlaythroughId)
  const setCurrentGameAndPlaythrough = useAppStore(
    (s) => s.setCurrentGameAndPlaythrough
  )

  const [game, setGame] = useState<Game | null>(null)
  const [playthrough, setPlaythrough] = useState<
    Playthrough | null | undefined
  >(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentGameId === null) return

    setGame(null)
    setPlaythrough(undefined)
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const [fetchedGame, playthroughs] = await Promise.all([
          gameRepository.getById(currentGameId!),
          playthroughRepository.getByGameId(currentGameId!),
        ])

        if (cancelled) return

        if (fetchedGame === undefined) {
          setCurrentGameAndPlaythrough(null, null)
          return
        }

        setGame(fetchedGame)
        const current = currentPlaythroughId
          ? playthroughs.find((p) => p.id === currentPlaythroughId)
          : null
        setPlaythrough(current ?? null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [currentGameId, currentPlaythroughId, setCurrentGameAndPlaythrough])

  if (currentGameId === null) {
    return <></>
  }

  if (isLoading) {
    return <p className="text-slate-500">Loading…</p>
  }

  if (game === null) {
    return <></>
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-slate-800">{game.name}</h2>
      <p className="text-slate-600">
        {playthrough !== undefined && playthrough !== null
          ? playthrough.name || 'Unnamed playthrough'
          : 'No playthrough'}
      </p>
    </div>
  )
}
