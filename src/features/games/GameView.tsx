import { useCallback, useEffect, useState } from 'react'
import {
  gameRepository,
  placeRepository,
  playthroughRepository,
} from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import type { Game } from '../../types/Game'
import type { Playthrough } from '../../types/Playthrough'
import type { PlaceId } from '../../types/ids'
import { useReachablePlaces } from '../../hooks/useReachablePlaces'
import { EntityType } from '../../types/EntityType'
import { useGameViewStore } from '../../stores/gameViewStore'
import { PlacePicker } from '../../components/PlacePicker'
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
  const [placeNamesById, setPlaceNamesById] = useState<Record<string, string>>(
    {}
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaythroughPanelOpen, setIsPlaythroughPanelOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeSection, setActiveSection] = useState<EntityType>(
    EntityType.QUEST
  )
  const [isPositionSelectorOpen, setIsPositionSelectorOpen] = useState(false)
  const [positionDraftPlaceId, setPositionDraftPlaceId] = useState<
    PlaceId | ''
  >('')
  const mapUiMode = useGameViewStore((s) => s.mapUiMode)
  const lastViewedMapId = useGameViewStore((s) => s.lastViewedMapId)
  const openMapSelection = useGameViewStore((s) => s.openMapSelection)
  const openMapView = useGameViewStore((s) => s.openMapView)

  const hasPlaythroughForReachability =
    playthrough !== undefined && playthrough !== null
  const currentPositionPlaceIdForReachability = hasPlaythroughForReachability
    ? (playthrough?.currentPositionPlaceId as PlaceId | null)
    : null
  const { reachablePlaceIds } = useReachablePlaces(
    currentGameId,
    currentPlaythroughId,
    currentPositionPlaceIdForReachability ?? null
  )

  const refetchPlaythroughs = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  /**
   * Handles sidebar section selection, including custom behavior
   * for the Maps section to toggle between selection and map view
   * and to restore the last viewed map when returning from
   * another section.
   *
   * @param section - Section selected by the user.
   */
  const handleSelectSection = useCallback(
    (section: EntityType) => {
      if (section !== EntityType.MAP) {
        setActiveSection(section)
        return
      }

      if (activeSection !== EntityType.MAP) {
        if (lastViewedMapId !== null) {
          openMapView(lastViewedMapId)
        } else {
          openMapSelection()
        }
        setActiveSection(EntityType.MAP)
        return
      }

      if (mapUiMode === 'view') {
        openMapSelection()
      }

      setActiveSection(EntityType.MAP)
    },
    [activeSection, lastViewedMapId, mapUiMode, openMapSelection, openMapView]
  )

  useEffect(() => {
    if (currentGameId === null) return

    setGame(null)
    setPlaythrough(undefined)
    setPlaceNamesById({})
    setIsPositionSelectorOpen(false)
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const [fetchedGame, playthroughs, places] = await Promise.all([
          gameRepository.getById(currentGameId!),
          playthroughRepository.getByGameId(currentGameId!),
          placeRepository.getByGameId(currentGameId!),
        ])

        if (cancelled) return

        if (fetchedGame === undefined) {
          setCurrentGameAndPlaythrough(null, null)
          return
        }

        setGame(fetchedGame)
        setPlaythroughs(playthroughs)
        const placeNameEntries = places.map((p) => [p.id, p.name] as const)
        setPlaceNamesById(Object.fromEntries(placeNameEntries))
        const current = currentPlaythroughId
          ? playthroughs.find((p) => p.id === currentPlaythroughId)
          : null
        const resolvedPlaythrough = current ?? null
        setPlaythrough(resolvedPlaythrough)
        setPositionDraftPlaceId(
          (resolvedPlaythrough?.currentPositionPlaceId as PlaceId | null) ?? ''
        )
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

  const hasPlaythrough = playthrough !== undefined && playthrough !== null
  const currentPositionPlaceId = hasPlaythrough
    ? (playthrough.currentPositionPlaceId as PlaceId | null)
    : null
  const currentPositionLabel =
    !hasPlaythrough || currentPlaythroughId === null
      ? 'No playthrough'
      : currentPositionPlaceId
        ? (placeNamesById[currentPositionPlaceId] ?? 'Unknown place')
        : 'Not set'

  /**
   * Handles the saving of the current position.
   */
  const handleSaveCurrentPosition = async () => {
    if (!hasPlaythrough || !currentPlaythroughId || !playthrough) return
    const updated: Playthrough = {
      ...playthrough,
      currentPositionPlaceId: positionDraftPlaceId || null,
    }
    await playthroughRepository.update(updated)
    setIsPositionSelectorOpen(false)
    refetchPlaythroughs()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-slate-800">{game.name}</h2>
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
          {/* Manage playthroughs button */}
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

          {/* Current position button */}
          <button
            type="button"
            onClick={() => {
              if (!hasPlaythrough || currentPlaythroughId === null) return
              setIsPositionSelectorOpen((open) => !open)
            }}
            disabled={!hasPlaythrough || currentPlaythroughId === null}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Set current position"
          >
            <span className="uppercase tracking-wide text-[0.65rem] text-slate-400">
              At
            </span>
            <span className="truncate max-w-[10rem] text-slate-700">
              {currentPositionLabel}
            </span>
          </button>
        </div>

        {/* Current position selector */}
        {isPositionSelectorOpen &&
        hasPlaythrough &&
        currentPlaythroughId !== null ? (
          <div className="mt-1 flex w-full flex-col gap-2 rounded border border-slate-200 bg-slate-50 p-2 sm:w-auto">
            <label
              htmlFor="current-position-place"
              className="text-xs font-medium text-slate-600"
            >
              Current position
            </label>

            {/* Current position picker */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-[10rem] flex-1">
                <PlacePicker
                  id="current-position-place"
                  gameId={currentGameId}
                  value={positionDraftPlaceId}
                  onChange={setPositionDraftPlaceId}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveCurrentPosition()}
                  className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPositionSelectorOpen(false)
                    setPositionDraftPlaceId(
                      (playthrough.currentPositionPlaceId as PlaceId | null) ??
                        ''
                    )
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <GameViewSidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded border border-slate-200 bg-white p-4">
          <GameViewContent
            gameId={currentGameId}
            playthroughId={currentPlaythroughId}
            section={activeSection}
            reachablePlaceIds={reachablePlaceIds}
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
