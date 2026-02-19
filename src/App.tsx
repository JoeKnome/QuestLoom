import { useCallback } from 'react'
import { GameListScreen } from './features/games/GameListScreen'
import { GameView } from './features/games/GameView'
import { useAppStore } from './stores/appStore'

/**
 * Root app component: shell layout and main content.
 * Shows game list when no game is selected; shows game view when a game is current.
 * Logo click clears selection and returns to the game list.
 */
function App() {
  const currentGameId = useAppStore((s) => s.currentGameId)
  const setCurrentGameAndPlaythrough = useAppStore(
    (s) => s.setCurrentGameAndPlaythrough
  )

  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setCurrentGameAndPlaythrough(null, null)
      e.currentTarget.blur()
    },
    [setCurrentGameAndPlaythrough]
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={handleLogoClick}
          className="cursor-pointer text-xl font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
          aria-label="QuestLoom – back to game list"
        >
          QuestLoom
        </button>
      </header>
      <main className="flex min-h-0 flex-1 flex-col p-4">
        {currentGameId !== null ? <GameView /> : <GameListScreen />}
      </main>
    </div>
  )
}

export default App
