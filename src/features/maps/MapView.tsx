import { useEffect, useState } from 'react'
import { mapRepository } from '../../lib/repositories'
import type { Map } from '../../types/Map'
import type { GameId, MapId } from '../../types/ids'

/**
 * Props for the MapView component.
 */
export interface MapViewProps {
  /** Current game ID (reserved for future validation and scoping). */
  gameId: GameId
  /** ID of the map to display. */
  mapId: MapId
}

/**
 * Minimal map view for Phase 4.1.
 * Loads a single map by ID and renders its name and a static image preview.
 * Future phases will extend this component with zoom, pan, and markers.
 *
 * @param props.gameId - Current game ID (not yet used for filtering).
 * @param props.mapId - Map ID to load and display.
 * @returns A JSX element representing the MapView component.
 */
export function MapView({ gameId, mapId }: MapViewProps): JSX.Element {
  const [map, setMap] = useState<Map | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const result = await mapRepository.getById(mapId)
        if (cancelled) return
        if (result && result.gameId === gameId) {
          setMap(result)
        } else if (result && result.gameId !== gameId) {
          setMap(null)
        } else {
          setMap(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [gameId, mapId])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">Loading map…</p>
      </div>
    )
  }

  if (map === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-slate-500">
          Map not found. It may have been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4" aria-label="Map view">
      <header className="border-b border-slate-200 pb-2">
        <h3 className="text-base font-medium text-slate-800">{map?.name}</h3>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {map?.imageUrl ? (
          <div className="relative max-h-full max-w-full overflow-hidden rounded border border-slate-200 bg-slate-50">
            <img
              src={map?.imageUrl}
              alt={map?.name}
              className="block max-h-[480px] max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
            <p className="text-sm text-slate-500">
              No image set for this map yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
