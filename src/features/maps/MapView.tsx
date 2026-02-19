import { useCallback, useEffect, useRef, useState } from 'react'
import {
  insightRepository,
  itemRepository,
  mapMarkerRepository,
  mapRepository,
  personRepository,
  placeRepository,
  questRepository,
} from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import { useGameViewStore } from '../../stores/gameViewStore'
import type { Map } from '../../types/Map'
import type { MapMarker } from '../../types/MapMarker'
import type { GameId, MapId } from '../../types/ids'
import { EntityType } from '../../types/EntityType'
import { getEntityDisplayName } from '../../utils/getEntityDisplayName'
import { MapMarkerBadge } from './MapMarkerBadge'

const MIN_SCALE = 0.1
const MAX_SCALE = 10
const ZOOM_STEP = 1.25

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
 * Computes scale and translation to fit the image inside the container (object-contain style).
 *
 * @param containerWidth - The width of the container.
 * @param containerHeight - The height of the container.
 * @param imageWidth - The width of the image.
 * @param imageHeight - The height of the image.
 * @returns The scale and translation to fit the image inside the container.
 */
function fitToView(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): { scale: number; x: number; y: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { scale: 1, x: 0, y: 0 }
  }
  const scale = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
    1
  )
  const x = (containerWidth - imageWidth * scale) / 2
  const y = (containerHeight - imageHeight * scale) / 2
  return { scale, x, y }
}

/**
 * Map view with zoom and pan. Loads the map and its image (URL or uploaded blob),
 * displays it in a pannable/zoomable area with toolbar controls, and persists
 * zoom/pan per map when switching tabs.
 *
 * @param props.gameId - Current game ID for validation.
 * @param props.mapId - Map ID to load and display.
 * @returns A JSX element representing the MapView component.
 */
export function MapView({ gameId, mapId }: MapViewProps): JSX.Element {
  const [map, setMap] = useState<Map | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [imageDisplayUrl, setImageDisplayUrl] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const imageRevokeRef = useRef<(() => void) | undefined>(undefined)

  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [markerLabels, setMarkerLabels] = useState<Record<string, string>>({})

  /** Image intrinsic size (set on load) so the transform wrapper matches content size. */
  const [imageSize, setImageSize] = useState<{
    width: number
    height: number
  } | null>(null)

  const [scale, setScale] = useState(1)
  const [translateX, setTranslateX] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, translateX: 0, translateY: 0 })
  const lastTransformRef = useRef({ scale: 1, x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const setMapViewTransform = useGameViewStore((s) => s.setMapViewTransform)
  const storedTransform = useGameViewStore((s) => s.mapViewTransform[mapId])
  const currentPlaythroughId = useAppStore((s) => s.currentPlaythroughId)

  /** Temporary debug: loading state for "Add test marker" (remove in Phase 4.6). */
  const [isAddingTestMarker, setIsAddingTestMarker] = useState(false)
  /** Temporary debug: error message for test marker (remove in Phase 4.6). */
  const [testMarkerError, setTestMarkerError] = useState<string | null>(null)

  /**
   * Temporary debug: creates a marker for a random game entity at a random
   * position so Phase 4.5 marker behavior can be validated without the
   * Phase 4.6 context menu. REMOVE when Phase 4.6 is implemented.
   */
  const handleAddTestMarker = useCallback(async () => {
    setTestMarkerError(null)
    setIsAddingTestMarker(true)
    try {
      const [quests, insights, items, persons, places] = await Promise.all([
        questRepository.getByGameId(gameId),
        insightRepository.getByGameId(gameId),
        itemRepository.getByGameId(gameId),
        personRepository.getByGameId(gameId),
        placeRepository.getByGameId(gameId),
      ])
      const candidates: Array<{
        entityType: EntityType
        entityId: string
      }> = []
      if (quests.length > 0)
        candidates.push({
          entityType: EntityType.QUEST,
          entityId: quests[Math.floor(Math.random() * quests.length)].id,
        })
      if (insights.length > 0)
        candidates.push({
          entityType: EntityType.INSIGHT,
          entityId: insights[Math.floor(Math.random() * insights.length)].id,
        })
      if (items.length > 0)
        candidates.push({
          entityType: EntityType.ITEM,
          entityId: items[Math.floor(Math.random() * items.length)].id,
        })
      if (persons.length > 0)
        candidates.push({
          entityType: EntityType.PERSON,
          entityId: persons[Math.floor(Math.random() * persons.length)].id,
        })
      if (places.length > 0)
        candidates.push({
          entityType: EntityType.PLACE,
          entityId: places[Math.floor(Math.random() * places.length)].id,
        })
      if (candidates.length === 0) {
        setTestMarkerError(
          'Add at least one quest, insight, item, person, or place first.'
        )
        return
      }
      const pick = candidates[Math.floor(Math.random() * candidates.length)]
      const position = {
        x: Math.random() * 0.7 + 0.15,
        y: Math.random() * 0.7 + 0.15,
      }
      const testLabelCount = markers.filter((m) =>
        m.label?.startsWith('Test ')
      ).length
      const label = `Test ${testLabelCount + 1}`
      await mapMarkerRepository.create({
        gameId,
        mapId,
        playthroughId: currentPlaythroughId ?? undefined,
        entityType: pick.entityType,
        entityId: pick.entityId as MapMarker['entityId'],
        label,
        position,
      })
      const next = await mapMarkerRepository.getByMapId(
        gameId,
        mapId,
        currentPlaythroughId
      )
      setMarkers(next)
    } catch (err) {
      setTestMarkerError(
        err instanceof Error ? err.message : 'Failed to add test marker'
      )
    } finally {
      setIsAddingTestMarker(false)
    }
  }, [gameId, mapId, currentPlaythroughId, markers])

  /** Apply a transform and persist it to the store. */
  const applyTransform = useCallback(
    (s: number, x: number, y: number) => {
      setScale(s)
      setTranslateX(x)
      setTranslateY(y)
      lastTransformRef.current = { scale: s, x, y }
      setMapViewTransform(mapId, { scale: s, x, y })
    },
    [mapId, setMapViewTransform]
  )

  /** Reset view to fit the image in the viewport. */
  const handleResetView = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return
    const rect = container.getBoundingClientRect()
    const fit = fitToView(
      rect.width,
      rect.height,
      img.naturalWidth,
      img.naturalHeight
    )
    applyTransform(fit.scale, fit.x, fit.y)
  }, [applyTransform])

  /** Zoom in/out centered on viewport. */
  const handleZoomBy = useCallback(
    (factor: number) => {
      const container = containerRef.current
      const img = imgRef.current
      if (!container || !img) return
      const rect = container.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const contentX = (centerX - translateX) / scale
      const contentY = (centerY - translateY) / scale
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
      const newX = centerX - contentX * newScale
      const newY = centerY - contentY * newScale
      applyTransform(newScale, newX, newY)
    },
    [scale, translateX, translateY, applyTransform]
  )

  /** Initialize transform when image loads: use stored or fit-to-view. */
  const handleImageLoad = useCallback(() => {
    const container = containerRef.current
    const img = imgRef.current
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return

    setImageSize({ width: img.naturalWidth, height: img.naturalHeight })

    if (storedTransform) {
      setScale(storedTransform.scale)
      setTranslateX(storedTransform.x)
      setTranslateY(storedTransform.y)
      lastTransformRef.current = storedTransform
      return
    }

    const rect = container.getBoundingClientRect()
    const fit = fitToView(
      rect.width,
      rect.height,
      img.naturalWidth,
      img.naturalHeight
    )
    applyTransform(fit.scale, fit.x, fit.y)
  }, [storedTransform, applyTransform])

  // Load map and resolve image URL (URL or blob). Revoke is kept only in a ref so we
  // never run an effect that could revoke the current URL during Strict Mode double-mount.
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setImageLoadError(false)
      setImageDisplayUrl(null)
      setImageSize(null)
      try {
        const result = await mapRepository.getById(mapId)
        if (cancelled) return
        if (result && result.gameId === gameId) {
          setMap(result)
          const display = await mapRepository.getMapImageDisplayUrl(mapId)
          if (cancelled) return
          if (display) {
            // Only store the new revoke; do not revoke the previous here so we never
            // revoke the current URL during Strict Mode remount (same ref can persist).
            imageRevokeRef.current = display.revoke
            setImageDisplayUrl(display.url)
          } else {
            imageRevokeRef.current = undefined
            setMap((m) => m ?? null)
          }
        } else {
          imageRevokeRef.current = undefined
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

  // Load markers for the current map.
  useEffect(() => {
    let cancelled = false

    async function loadMarkers() {
      try {
        const list = await mapMarkerRepository.getByMapId(
          gameId,
          mapId,
          currentPlaythroughId
        )
        if (cancelled) return
        setMarkers(list)
      } catch {
        if (!cancelled) {
          setMarkers([])
        }
      }
    }

    loadMarkers()

    return () => {
      cancelled = true
    }
  }, [gameId, mapId, currentPlaythroughId])

  // Resolve display names for markers to use as tooltip text and initials.
  useEffect(() => {
    let cancelled = false

    async function loadLabels() {
      const entries: Array<[string, string]> = []
      for (const marker of markers) {
        const id = marker.entityId as string
        // Map markers are restricted to endpoint entity types; THREAD and MAP are never used.
        const name = await getEntityDisplayName(id)
        if (cancelled) return
        entries.push([marker.id, name || id])
      }
      if (!cancelled) {
        const next: Record<string, string> = {}
        for (const [id, label] of entries) {
          next[id] = label
        }
        setMarkerLabels(next)
      }
    }

    if (markers.length === 0) {
      setMarkerLabels({})
      return
    }

    loadLabels()

    return () => {
      cancelled = true
    }
  }, [markers])

  // Revoke object URL only on real unmount (navigate away). Use a delay so that in
  // React Strict Mode the "unmount" cleanup runs but we revoke after the next tick;
  // by then Strict Mode has remounted and the new instance has its own ref, so we
  // only revoke the previous instance's URL, not the current one.
  useEffect(() => {
    return () => {
      const toRevoke = imageRevokeRef.current
      if (toRevoke) {
        setTimeout(() => toRevoke(), 0)
      }
    }
  }, [])

  // Pan handlers
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 || !imageDisplayUrl) return
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        translateX,
        translateY,
      }
    },
    [imageDisplayUrl, translateX, translateY]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      const x = panStartRef.current.translateX + dx
      const y = panStartRef.current.translateY + dy
      setTranslateX(x)
      setTranslateY(y)
      lastTransformRef.current = { scale, x, y }
    },
    [isPanning, scale]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      e.currentTarget.releasePointerCapture(e.pointerId)
      if (isPanning) {
        setMapViewTransform(mapId, lastTransformRef.current)
      }
      setIsPanning(false)
    },
    [isPanning, mapId, setMapViewTransform]
  )

  const onPointerCancel = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Wheel zoom toward cursor
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!imageDisplayUrl || !containerRef.current) return
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP
      const rect = containerRef.current.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const contentX = (cx - translateX) / scale
      const contentY = (cy - translateY) / scale
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
      const newX = cx - contentX * newScale
      const newY = cy - contentY * newScale
      applyTransform(newScale, newX, newY)
    },
    [imageDisplayUrl, scale, translateX, translateY, applyTransform]
  )

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

  const hasImage = imageDisplayUrl && !imageLoadError

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2" aria-label="Map view">
      <header className="shrink-0 border-b border-slate-200 pb-2">
        <h3 className="text-base font-medium text-slate-800">{map?.name}</h3>
      </header>

      {hasImage && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetView}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="Reset view"
          >
            Reset view
          </button>
          <button
            type="button"
            onClick={() => handleZoomBy(ZOOM_STEP)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="Zoom in"
          >
            Zoom in
          </button>
          <button
            type="button"
            onClick={() => handleZoomBy(1 / ZOOM_STEP)}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="Zoom out"
          >
            Zoom out
          </button>
          {/* Temporary debug for Phase 4.5 validation. REMOVE in Phase 4.6 when context menu supports adding markers. */}
          <span className="ml-2 border-l border-slate-300 pl-2 text-slate-400">
            Debug:
          </span>
          <button
            type="button"
            onClick={handleAddTestMarker}
            disabled={isAddingTestMarker}
            className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-sm text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            aria-label="Add test marker (debug)"
            title="Add a marker for a random entity at a random position. Remove in Phase 4.6."
          >
            {isAddingTestMarker ? 'Adding…' : 'Add test marker'}
          </button>
          {testMarkerError && (
            <span className="text-sm text-amber-700" role="alert">
              {testMarkerError}
            </span>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-hidden rounded border border-slate-200 bg-slate-100"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
        onWheel={onWheel}
        style={{ touchAction: 'none' }}
        role="img"
        aria-label={map?.name ?? 'Map'}
      >
        {!hasImage && (
          <div className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
            {imageLoadError ? (
              <p className="text-sm text-slate-500">Failed to load image.</p>
            ) : imageDisplayUrl === null && map !== undefined ? (
              <p className="text-sm text-slate-500">
                No image set for this map yet.
              </p>
            ) : null}
          </div>
        )}

        {hasImage && (
          <div
            className="absolute left-0 top-0 select-none"
            style={{
              width: imageSize?.width ?? 0,
              height: imageSize?.height ?? 0,
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
              transformOrigin: '0 0',
            }}
          >
            <img
              ref={imgRef}
              src={imageDisplayUrl}
              alt={map?.name ?? 'Map'}
              className="block h-full w-full select-none object-contain"
              style={{ display: 'block' }}
              onLoad={handleImageLoad}
              onError={() => setImageLoadError(true)}
              draggable={false}
            />
            {markers.map((marker) => {
              // Position in image pixel space (logical 0–1 × intrinsic size).
              const w = imageSize?.width ?? 0
              const h = imageSize?.height ?? 0
              const left = w > 0 ? marker.position.x * w : marker.position.x
              const top = h > 0 ? marker.position.y * h : marker.position.y

              const entityName = markerLabels[marker.id] ?? ''
              const markerLabel = marker.label?.trim() ?? ''
              const tooltip = markerLabel
                ? entityName
                  ? `${markerLabel} — ${entityName}`
                  : markerLabel
                : entityName

              // Single-letter badge should prefer the entity name; fall back to
              // the marker label and then to a type-based default.
              const initialSource =
                entityName ||
                markerLabel ||
                (marker.entityType === EntityType.PLACE
                  ? 'P'
                  : marker.entityType === EntityType.ITEM
                    ? 'I'
                    : marker.entityType === EntityType.QUEST
                      ? 'Q'
                      : marker.entityType === EntityType.INSIGHT
                        ? 'N'
                        : marker.entityType === EntityType.PERSON
                          ? 'C'
                          : '?')

              return (
                <div
                  key={marker.id}
                  className="absolute"
                  style={{
                    left,
                    top,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <MapMarkerBadge
                    entityType={marker.entityType}
                    initial={initialSource}
                    title={tooltip}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
