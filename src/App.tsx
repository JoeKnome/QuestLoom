import { GameListScreen } from './features/games/GameListScreen'

/**
 * Root app component: shell layout and main content (game list screen).
 */
function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">QuestLoom</h1>
      </header>
      <main className="p-4">
        <GameListScreen />
      </main>
    </div>
  )
}

export default App
