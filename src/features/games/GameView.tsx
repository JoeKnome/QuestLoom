import { useCallback, useEffect, useState } from 'react'
import { gameRepository, playthroughRepository } from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { Game } from '../../types/Game'
import type { Playthrough } from '../../types/Playthrough'
import type { GameViewSection } from './GameViewSection'
import { GameViewContent } from './GameViewContent'
import { GameViewSidebar } from './GameViewSidebar'
import { PlaythroughPanel } from './PlaythroughPanel'

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
  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([])
  const [playthrough, setPlaythrough] = useState<
    Playthrough | null | undefined
  >(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaythroughPanelOpen, setIsPlaythroughPanelOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeSection, setActiveSection] = useState<GameViewSection>('quests')

  const refetchPlaythroughs = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

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
        setPlaythroughs(playthroughs)
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
  }, [
    currentGameId,
    currentPlaythroughId,
    setCurrentGameAndPlaythrough,
    refreshKey,
  ])

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-800">{game.name}</h2>
        <button
          type="button"
          onClick={() => setIsPlaythroughPanelOpen(true)}
          className="rounded border border-slate-200 bg-white px-3 py-1.5 text-left text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
          aria-label="Manage playthroughs"
        >
          {playthrough !== undefined && playthrough !== null
            ? playthrough.name || 'Unnamed playthrough'
            : 'No playthrough'}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <GameViewSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />
        <div className="min-w-0 flex-1 overflow-auto rounded border border-slate-200 bg-white p-4">
          <GameViewContent
            gameId={currentGameId}
            playthroughId={currentPlaythroughId}
            section={activeSection}
          />
        </div>
      </div>
      {isPlaythroughPanelOpen ? (
        <PlaythroughPanel
          gameId={currentGameId}
          currentPlaythroughId={currentPlaythroughId}
          playthroughs={playthroughs}
          onClose={() => setIsPlaythroughPanelOpen(false)}
          onPlaythroughsChange={refetchPlaythroughs}
        />
      ) : null}
    </div>
  )
}
