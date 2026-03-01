import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ContextMenu } from '../../components/ContextMenu'
import { EntityPicker } from '../../components/EntityPicker'
import { checkEntityAvailabilityWithReachability } from '../../lib/requirements'
import {
  insightRepository,
  itemRepository,
  mapMarkerRepository,
  mapRepository,
  pathRepository,
  personRepository,
  placeRepository,
  questRepository,
  threadRepository,
} from '../../lib/repositories'
import { useAppStore } from '../../stores/appStore'
import { useGameViewStore } from '../../stores/gameViewStore'
import type { Map } from '../../types/Map'
import type { MapMarker } from '../../types/MapMarker'
import type {
  GameId,
  InsightId,
  ItemId,
  MapId,
  PersonId,
  PlaceId,
  QuestId,
} from '../../types/ids'
import { EntityType } from '../../types/EntityType'
import { THREAD_ENDPOINT_ENTITY_TYPES } from '../../types/EntityType'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { getEntityDisplayName } from '../../utils/getEntityDisplayName'
import { ENTITY_TYPE_LABELS } from '../../utils/entityTypeLabels'
import { MapMarkerBadge } from './MapMarkerBadge'

/** Zoom-out limit as a multiple of fit-to-view scale (similar periphery across maps). */
const MIN_SCALE_MULTIPLIER = 0.5
/** Zoom-in limit as a multiple of fit-to-view scale (similar max zoom across maps). */
const MAX_SCALE_MULTIPLIER = 4
const ZOOM_STEP = 1.25

/** Minimum effective scale for markers when zoomed out (keeps them visible). */
const MIN_MARKER_SCALE = 0.5
/** Maximum effective scale for markers when zoomed in (prevents them dominating). */
const MAX_MARKER_SCALE = 2.0

/** Context menu state for map background (add marker here). */
interface MapContextMenuState {
  /** The type of context menu. */
  type: 'map'
  /** The X coordinate of the client. */
  clientX: number
  /** The Y coordinate of the client. */
  clientY: number
  /** The logical position of the context menu. */
  logicalPosition: { x: number; y: number }
}

/** Context menu state for an existing marker. */
interface MarkerContextMenuState {
  /** The type of context menu. */
  type: 'marker'
  /** The marker that is being context-menued. */
  marker: MapMarker
  /** The X coordinate of the client. */
  clientX: number
  /** The Y coordinate of the client. */
  clientY: number
}

/** Union of context menu states. */
type ContextMenuState = MapContextMenuState | MarkerContextMenuState | null

/**
 * Props for the MapView component.
 */
export interface MapViewProps {
  /** Current game ID (reserved for future validation and scoping). */
  gameId: GameId

  /** ID of the map to display. */
  mapId: MapId

  /** Reachable place IDs from current position (for marker availability styling). */
  reachablePlaceIds?: Set<PlaceId>
}

/**
 * Computes scale and translation to fit the image inside the container (object-contain style).
 * Scale is not capped at 1 so small images are scaled up to fill the view.
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
    containerHeight / imageHeight
  )
  const x = (containerWidth - imageWidth * scale) / 2
  const y = (containerHeight - imageHeight * scale) / 2
  return { scale, x, y }
}

/**
 * Scale limits derived from fit-to-view so zoom range is consistent across map image dimensions.
 *
 * @param fitScale - Scale that fits the image in the container (from fitToView).
 * @returns Min and max effective scale for clamping.
 */
function scaleLimitsFromFit(fitScale: number): {
  minEffectiveScale: number
  maxEffectiveScale: number
} {
  return {
    minEffectiveScale: fitScale * MIN_SCALE_MULTIPLIER,
    maxEffectiveScale: fitScale * MAX_SCALE_MULTIPLIER,
  }
}

/**
 * Converts client coordinates to map logical coordinates (0–1 = image bounds;
 * outside 0–1 = periphery). Does not clamp so markers can be placed in the periphery.
 *
 * @param clientX - Client X (e.g. from pointer event).
 * @param clientY - Client Y (e.g. from pointer event).
 * @param containerRect - Container getBoundingClientRect().
 * @param translateX - Current pan X.
 * @param translateY - Current pan Y.
 * @param scale - Current zoom scale.
 * @param imageWidth - Image intrinsic width.
 * @param imageHeight - Image intrinsic height.
 * @returns Logical position { x, y } in map coordinate space.
 */
function clientToLogical(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  translateX: number,
  translateY: number,
  scale: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  if (imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0 }
  }
  const contentX = (clientX - containerRect.left - translateX) / scale
  const contentY = (clientY - containerRect.top - translateY) / scale
  return {
    x: contentX / imageWidth,
    y: contentY / imageHeight,
  }
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
export function MapView({
  gameId,
  mapId,
  reachablePlaceIds = new Set(),
}: MapViewProps): JSX.Element {
  const [map, setMap] = useState<Map | null | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [imageDisplayUrl, setImageDisplayUrl] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [markerAvailabilityByEntityId, setMarkerAvailabilityByEntityId] =
    useState<Record<string, boolean>>({})
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
  /** Ref for pending position during move mode so commit in onPointerUp has latest value. */
  const moveModePendingPositionRef = useRef<{ x: number; y: number } | null>(
    null
  )
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressDataRef = useRef<{
    clientX: number
    clientY: number
    target: EventTarget
    translateX: number
    translateY: number
    scale: number
    imageSize: { width: number; height: number } | null
  } | null>(null)
  const markersRef = useRef<MapMarker[]>([])
  markersRef.current = markers

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const setMapViewTransform = useGameViewStore((s) => s.setMapViewTransform)
  const storedTransform = useGameViewStore((s) => s.mapViewTransform[mapId])
  const currentPlaythroughId = useAppStore((s) => s.currentPlaythroughId)

  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null)
  /** When set, the "Add marker here (existing entity)" modal is open with this logical position. */
  const [addMarkerExistingModal, setAddMarkerExistingModal] = useState<{
    logicalPosition: { x: number; y: number }
  } | null>(null)
  const [addMarkerEntityType, setAddMarkerEntityType] = useState<EntityType>(
    EntityType.PLACE
  )
  const [addMarkerEntityId, setAddMarkerEntityId] = useState('')

  /** When set, the "Add marker here (new entity)" modal is open with this logical position. */
  const [addMarkerNewModal, setAddMarkerNewModal] = useState<{
    logicalPosition: { x: number; y: number }
  } | null>(null)
  const [addMarkerNewEntityType, setAddMarkerNewEntityType] =
    useState<EntityType>(EntityType.PLACE)
  const [addMarkerNewName, setAddMarkerNewName] = useState('')
  const [addMarkerNewItemLocation, setAddMarkerNewItemLocation] = useState('')
  const [addMarkerNewSubmitting, setAddMarkerNewSubmitting] = useState(false)

  /** When set, the "Delete marker only" confirm dialog is open for this marker ID. */
  const [deleteMarkerOnlyTarget, setDeleteMarkerOnlyTarget] = useState<
    string | null
  >(null)
  /** When set, the "Delete marker and entity" confirm dialog is open for this marker. */
  const [deleteMarkerAndEntityTarget, setDeleteMarkerAndEntityTarget] =
    useState<MapMarker | null>(null)
  /** When set, we are in move mode for this marker. */
  const [moveModeMarker, setMoveModeMarker] = useState<MapMarker | null>(null)
  /** Pending position while moving a marker (logical coords). */
  const [moveModePendingPosition, setMoveModePendingPosition] = useState<{
    x: number
    y: number
  } | null>(null)

  /** Reload markers from the repository. */
  const loadMarkers = useCallback(async () => {
    try {
      const list = await mapMarkerRepository.getByMapId(
        gameId,
        mapId,
        currentPlaythroughId
      )
      setMarkers(list)
    } catch {
      setMarkers([])
    }
  }, [gameId, mapId, currentPlaythroughId])

  /** Compute availability per marker entity when playthrough is set. */
  useEffect(() => {
    if (!currentPlaythroughId || markers.length === 0) {
      setMarkerAvailabilityByEntityId({})
      return
    }
    let cancelled = false
    const entityIds = [...new Set(markers.map((m) => m.entityId))]
    Promise.all(
      entityIds.map(async (entityId) => {
        const available = await checkEntityAvailabilityWithReachability(
          gameId,
          currentPlaythroughId!,
          entityId,
          reachablePlaceIds
        )
        return [entityId, available] as const
      })
    ).then((entries) => {
      if (!cancelled) {
        setMarkerAvailabilityByEntityId(Object.fromEntries(entries))
      }
    })
    return () => {
      cancelled = true
    }
  }, [gameId, currentPlaythroughId, markers, reachablePlaceIds])

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
      if (!container || !img?.naturalWidth || !img.naturalHeight) return
      const rect = container.getBoundingClientRect()
      const fit = fitToView(
        rect.width,
        rect.height,
        img.naturalWidth,
        img.naturalHeight
      )
      const { minEffectiveScale, maxEffectiveScale } = scaleLimitsFromFit(
        fit.scale
      )
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const contentX = (centerX - translateX) / scale
      const contentY = (centerY - translateY) / scale
      const newScale = Math.min(
        maxEffectiveScale,
        Math.max(minEffectiveScale, scale * factor)
      )
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

    const rect = container.getBoundingClientRect()
    const fit = fitToView(
      rect.width,
      rect.height,
      img.naturalWidth,
      img.naturalHeight
    )
    const { minEffectiveScale, maxEffectiveScale } = scaleLimitsFromFit(
      fit.scale
    )

    if (storedTransform) {
      const clampedScale = Math.min(
        maxEffectiveScale,
        Math.max(minEffectiveScale, storedTransform.scale)
      )
      const stored = {
        scale: clampedScale,
        x: storedTransform.x,
        y: storedTransform.y,
      }
      setScale(stored.scale)
      setTranslateX(stored.x)
      setTranslateY(stored.y)
      lastTransformRef.current = stored
      setMapViewTransform(mapId, stored)
      return
    }

    applyTransform(fit.scale, fit.x, fit.y)
  }, [storedTransform, applyTransform, mapId, setMapViewTransform])

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

  // Escape cancels move mode without saving.
  useEffect(() => {
    if (!moveModeMarker) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoveModeMarker(null)
        setMoveModePendingPosition(null)
        moveModePendingPositionRef.current = null
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveModeMarker])

  // Pan handlers: left button pans on map background; middle button always pans. Left click on marker does not pan. In move mode, left button does not pan.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!imageDisplayUrl) return
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      longPressDataRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target,
        translateX,
        translateY,
        scale,
        imageSize,
      }
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null
        const data = longPressDataRef.current
        if (!data || !containerRef.current) return
        const isMarkerEl = (data.target as HTMLElement).closest?.(
          '[data-marker-id]'
        ) as HTMLElement | null
        if (isMarkerEl) {
          const markerId = isMarkerEl.getAttribute('data-marker-id')
          const marker = markerId
            ? (markersRef.current.find((m) => m.id === markerId) ?? null)
            : null
          if (marker) {
            setContextMenu({
              type: 'marker',
              marker,
              clientX: data.clientX,
              clientY: data.clientY,
            })
          }
        } else if (data.imageSize) {
          const rect = containerRef.current.getBoundingClientRect()
          const logicalPosition = clientToLogical(
            data.clientX,
            data.clientY,
            rect,
            data.translateX,
            data.translateY,
            data.scale,
            data.imageSize.width,
            data.imageSize.height
          )
          setContextMenu({
            type: 'map',
            clientX: data.clientX,
            clientY: data.clientY,
            logicalPosition,
          })
        }
      }, 500)
      if (e.button !== 0 && e.button !== 1) return
      if (moveModeMarker && e.button === 0) return
      const isMarker = (e.target as HTMLElement).closest?.(
        '[data-marker-id]'
      ) as HTMLElement | null
      if (isMarker && e.button === 0) return
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsPanning(true)
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        translateX,
        translateY,
      }
    },
    [imageDisplayUrl, moveModeMarker, translateX, translateY, scale, imageSize]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (moveModeMarker && !isPanning && containerRef.current && imageSize) {
        const rect = containerRef.current.getBoundingClientRect()
        const pos = clientToLogical(
          e.clientX,
          e.clientY,
          rect,
          translateX,
          translateY,
          scale,
          imageSize.width,
          imageSize.height
        )
        moveModePendingPositionRef.current = pos
        setMoveModePendingPosition(pos)
        return
      }
      if (!isPanning) return
      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      const x = panStartRef.current.translateX + dx
      const y = panStartRef.current.translateY + dy
      setTranslateX(x)
      setTranslateY(y)
      lastTransformRef.current = { scale, x, y }
    },
    [moveModeMarker, isPanning, imageSize, scale, translateX, translateY]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
      if (e.button !== 0 && e.button !== 1) return
      e.currentTarget.releasePointerCapture(e.pointerId)
      if (moveModeMarker && e.button === 0) {
        const pos =
          moveModePendingPositionRef.current ?? moveModeMarker.position
        mapMarkerRepository
          .update({ ...moveModeMarker, position: pos })
          .then(() => loadMarkers())
        setMoveModeMarker(null)
        setMoveModePendingPosition(null)
        moveModePendingPositionRef.current = null
        setIsPanning(false)
        return
      }
      if (isPanning) {
        setMapViewTransform(mapId, lastTransformRef.current)
      }
      setIsPanning(false)
    },
    [isPanning, mapId, moveModeMarker, loadMarkers, setMapViewTransform]
  )

  const onPointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setIsPanning(false)
  }, [])

  /** Open map or marker context menu on right-click. */
  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!imageDisplayUrl || imageLoadError || !containerRef.current) return
      e.preventDefault()
      const isMarkerEl = (e.target as HTMLElement).closest?.(
        '[data-marker-id]'
      ) as HTMLElement | null
      if (isMarkerEl) {
        const markerId = isMarkerEl.getAttribute('data-marker-id')
        const marker = markerId
          ? (markers.find((m) => m.id === markerId) ?? null)
          : null
        if (marker) {
          setContextMenu({
            type: 'marker',
            marker,
            clientX: e.clientX,
            clientY: e.clientY,
          })
        }
        return
      }
      if (!imageSize) return
      const rect = containerRef.current.getBoundingClientRect()
      const logicalPosition = clientToLogical(
        e.clientX,
        e.clientY,
        rect,
        translateX,
        translateY,
        scale,
        imageSize.width,
        imageSize.height
      )
      setContextMenu({
        type: 'map',
        clientX: e.clientX,
        clientY: e.clientY,
        logicalPosition,
      })
    },
    [
      imageDisplayUrl,
      imageLoadError,
      imageSize,
      markers,
      scale,
      translateX,
      translateY,
    ]
  )

  // Wheel zoom toward cursor
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const container = containerRef.current
      const img = imgRef.current
      if (
        !imageDisplayUrl ||
        !container ||
        !img?.naturalWidth ||
        !img.naturalHeight
      )
        return
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      const fit = fitToView(
        rect.width,
        rect.height,
        img.naturalWidth,
        img.naturalHeight
      )
      const { minEffectiveScale, maxEffectiveScale } = scaleLimitsFromFit(
        fit.scale
      )
      const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const contentX = (cx - translateX) / scale
      const contentY = (cy - translateY) / scale
      const newScale = Math.min(
        maxEffectiveScale,
        Math.max(minEffectiveScale, scale * factor)
      )
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
        onContextMenu={onContextMenu}
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
              // Position in image pixel space (logical 0–1 × intrinsic size). When in move mode, use pending position.
              const w = imageSize?.width ?? 0
              const h = imageSize?.height ?? 0
              const pos =
                moveModeMarker?.id === marker.id && moveModePendingPosition
                  ? moveModePendingPosition
                  : marker.position
              const left = w > 0 ? pos.x * w : pos.x
              const top = h > 0 ? pos.y * h : pos.y

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

              // Map marker scale proportionally over the map's zoom range so they
              // grow evenly from min to max instead of staying flat at the caps.
              const rect = containerRef.current?.getBoundingClientRect()
              const fitScale =
                rect && w > 0 && h > 0
                  ? fitToView(rect.width, rect.height, w, h).scale
                  : 1
              const { minEffectiveScale, maxEffectiveScale } =
                scaleLimitsFromFit(fitScale)
              const range = maxEffectiveScale - minEffectiveScale
              const t =
                range <= 0
                  ? 0
                  : Math.max(
                      0,
                      Math.min(1, (scale - minEffectiveScale) / range)
                    )
              const effectiveMarkerScale =
                MIN_MARKER_SCALE + t * (MAX_MARKER_SCALE - MIN_MARKER_SCALE)
              const markerLocalScale = effectiveMarkerScale / scale

              return (
                <div
                  key={marker.id}
                  data-marker-id={marker.id}
                  className="absolute"
                  style={{
                    left,
                    top,
                    transformOrigin: '50% 50%',
                    transform: `translate(-50%, -50%) scale(${markerLocalScale})`,
                  }}
                  onPointerDown={(e) => {
                    if (e.button === 0) e.stopPropagation()
                  }}
                >
                  <MapMarkerBadge
                    entityType={marker.entityType}
                    initial={initialSource}
                    title={tooltip}
                    available={
                      markerAvailabilityByEntityId[marker.entityId] ?? true
                    }
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {contextMenu?.type === 'map' && (
        <ContextMenu
          position={{ x: contextMenu.clientX, y: contextMenu.clientY }}
          aria-label="Map context menu"
          items={[
            {
              label: 'Add marker here (existing entity)',
              onClick: () => {
                setAddMarkerExistingModal({
                  logicalPosition: contextMenu.logicalPosition,
                })
                setContextMenu(null)
              },
            },
            {
              label: 'Add marker here (new entity)',
              onClick: () => {
                setAddMarkerNewModal({
                  logicalPosition: contextMenu.logicalPosition,
                })
                setAddMarkerNewEntityType(EntityType.PLACE)
                setAddMarkerNewName('')
                setAddMarkerNewItemLocation('')
                setContextMenu(null)
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {contextMenu?.type === 'marker' && (
        <ContextMenu
          position={{ x: contextMenu.clientX, y: contextMenu.clientY }}
          aria-label="Marker context menu"
          items={[
            {
              label: 'Move marker',
              onClick: () => {
                setMoveModeMarker(contextMenu.marker)
                const pos = { ...contextMenu.marker.position }
                setMoveModePendingPosition(pos)
                moveModePendingPositionRef.current = pos
                setContextMenu(null)
              },
            },
            {
              label: 'Delete marker only',
              onClick: () => {
                setDeleteMarkerOnlyTarget(contextMenu.marker.id)
                setContextMenu(null)
              },
            },
            {
              label: 'Delete marker and entity',
              onClick: () => {
                setDeleteMarkerAndEntityTarget(contextMenu.marker)
                setContextMenu(null)
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteMarkerOnlyTarget !== null}
        title="Delete marker"
        message="Remove only this marker from the map. The entity (quest, place, etc.) will remain."
        confirmLabel="Delete marker"
        variant="danger"
        onConfirm={async () => {
          if (deleteMarkerOnlyTarget === null) return
          await mapMarkerRepository.delete(deleteMarkerOnlyTarget)
          await loadMarkers()
          setDeleteMarkerOnlyTarget(null)
        }}
        onCancel={() => setDeleteMarkerOnlyTarget(null)}
      />

      <ConfirmDialog
        isOpen={deleteMarkerAndEntityTarget !== null}
        title="Delete marker and entity"
        message="This will remove the marker and the associated entity (quest, place, item, etc.) from the game. All threads and connections involving that entity will also be removed. This cannot be undone."
        confirmLabel="Delete both"
        variant="danger"
        onConfirm={async () => {
          if (deleteMarkerAndEntityTarget === null) return
          const { entityType, entityId } = deleteMarkerAndEntityTarget
          switch (entityType) {
            case EntityType.QUEST:
              await questRepository.delete(entityId as QuestId)
              break
            case EntityType.INSIGHT:
              await insightRepository.delete(entityId as InsightId)
              break
            case EntityType.ITEM:
              await itemRepository.delete(entityId as ItemId)
              break
            case EntityType.PERSON:
              await personRepository.delete(entityId as PersonId)
              break
            case EntityType.PLACE:
              await placeRepository.delete(entityId as PlaceId)
              break
            case EntityType.PATH:
              await pathRepository.delete(entityId as never)
              break
            default:
              return
          }
          await loadMarkers()
          setDeleteMarkerAndEntityTarget(null)
        }}
        onCancel={() => setDeleteMarkerAndEntityTarget(null)}
      />

      {addMarkerExistingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-marker-existing-title"
          onClick={() => setAddMarkerExistingModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="add-marker-existing-title"
              className="mb-3 text-lg font-semibold text-slate-900"
            >
              Add marker (existing entity)
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="add-marker-entity-type"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Entity type
                </label>
                <select
                  id="add-marker-entity-type"
                  value={addMarkerEntityType}
                  onChange={(e) => {
                    setAddMarkerEntityType(Number(e.target.value) as EntityType)
                    setAddMarkerEntityId('')
                  }}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
                >
                  {THREAD_ENDPOINT_ENTITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ENTITY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="add-marker-entity-picker"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Entity
                </label>
                <EntityPicker
                  id="add-marker-entity-picker"
                  gameId={gameId}
                  entityType={addMarkerEntityType}
                  value={addMarkerEntityId}
                  onChange={setAddMarkerEntityId}
                  aria-label="Select entity"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddMarkerExistingModal(null)
                  setAddMarkerEntityId('')
                }}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!addMarkerEntityId}
                onClick={async () => {
                  if (!addMarkerEntityId || !addMarkerExistingModal) return
                  await mapMarkerRepository.create({
                    gameId,
                    mapId,
                    playthroughId: currentPlaythroughId ?? undefined,
                    entityType: addMarkerEntityType,
                    entityId: addMarkerEntityId as MapMarker['entityId'],
                    position: addMarkerExistingModal.logicalPosition,
                  })
                  await loadMarkers()
                  setAddMarkerExistingModal(null)
                  setAddMarkerEntityId('')
                }}
                className="rounded border border-slate-300 bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Add marker
              </button>
            </div>
          </div>
        </div>
      )}

      {addMarkerNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-marker-new-title"
          onClick={() => !addMarkerNewSubmitting && setAddMarkerNewModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="add-marker-new-title"
              className="mb-3 text-lg font-semibold text-slate-900"
            >
              Add marker (new entity)
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="add-marker-new-type"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Entity type
                </label>
                <select
                  id="add-marker-new-type"
                  value={addMarkerNewEntityType}
                  onChange={(e) => {
                    setAddMarkerNewEntityType(
                      Number(e.target.value) as EntityType
                    )
                    setAddMarkerNewName('')
                    setAddMarkerNewItemLocation('')
                  }}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900"
                >
                  {THREAD_ENDPOINT_ENTITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ENTITY_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="add-marker-new-name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Name
                </label>
                <input
                  id="add-marker-new-name"
                  type="text"
                  value={addMarkerNewName}
                  onChange={(e) => setAddMarkerNewName(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              {addMarkerNewEntityType === EntityType.ITEM && (
                <div>
                  <label
                    htmlFor="add-marker-new-item-location"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Location (optional)
                  </label>
                  <EntityPicker
                    id="add-marker-new-item-location"
                    gameId={gameId}
                    entityType={EntityType.PLACE}
                    value={addMarkerNewItemLocation}
                    onChange={setAddMarkerNewItemLocation}
                    aria-label="Place where item can be found"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={addMarkerNewSubmitting}
                onClick={() => {
                  setAddMarkerNewModal(null)
                  setAddMarkerNewName('')
                  setAddMarkerNewItemLocation('')
                }}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addMarkerNewSubmitting || !addMarkerNewName.trim()}
                onClick={async () => {
                  if (!addMarkerNewModal || !addMarkerNewName.trim()) return
                  setAddMarkerNewSubmitting(true)
                  try {
                    let newEntityId: string
                    const pos = addMarkerNewModal.logicalPosition
                    switch (addMarkerNewEntityType) {
                      case EntityType.QUEST: {
                        const q = await questRepository.create({
                          gameId,
                          title: addMarkerNewName.trim(),
                          giver: '',
                        })
                        newEntityId = q.id
                        break
                      }
                      case EntityType.INSIGHT: {
                        const i = await insightRepository.create({
                          gameId,
                          title: addMarkerNewName.trim(),
                          content: '',
                        })
                        newEntityId = i.id
                        break
                      }
                      case EntityType.ITEM: {
                        const item = await itemRepository.create({
                          gameId,
                          name: addMarkerNewName.trim(),
                        })
                        newEntityId = item.id
                        if (addMarkerNewItemLocation) {
                          await threadRepository.create({
                            gameId,
                            sourceId: item.id,
                            targetId: addMarkerNewItemLocation,
                            subtype: ThreadSubtype.LOCATION,
                          })
                        }
                        break
                      }
                      case EntityType.PERSON: {
                        const p = await personRepository.create({
                          gameId,
                          name: addMarkerNewName.trim(),
                        })
                        newEntityId = p.id
                        break
                      }
                      case EntityType.PLACE: {
                        const pl = await placeRepository.create({
                          gameId,
                          name: addMarkerNewName.trim(),
                          map: mapId,
                        })
                        newEntityId = pl.id
                        break
                      }
                      default:
                        return
                    }
                    await mapMarkerRepository.create({
                      gameId,
                      mapId,
                      playthroughId: currentPlaythroughId ?? undefined,
                      entityType: addMarkerNewEntityType,
                      entityId: newEntityId as MapMarker['entityId'],
                      position: pos,
                    })
                    await loadMarkers()
                    setAddMarkerNewModal(null)
                    setAddMarkerNewName('')
                    setAddMarkerNewItemLocation('')
                  } finally {
                    setAddMarkerNewSubmitting(false)
                  }
                }}
                className="rounded border border-slate-300 bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {addMarkerNewSubmitting ? 'Creating…' : 'Create and add marker'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
