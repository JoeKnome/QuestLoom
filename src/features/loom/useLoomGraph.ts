/**
 * Loads game entities and threads, maps them to React Flow nodes and edges,
 * and runs d3-force layout. Used by LoomView.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { EntityType } from '../../types/EntityType'
import { ThreadSubtype } from '../../types/ThreadSubtype'
import { PathStatus } from '../../types/PathStatus'
import { QuestStatus } from '../../types/QuestStatus'
import { ItemStatus } from '../../types/ItemStatus'
import { InsightStatus } from '../../types/InsightStatus'
import { PersonStatus } from '../../types/PersonStatus'
import type { GameId, PlaceId, PlaythroughId } from '../../types/ids'
import {
  entityDiscoveryRepository,
  insightRepository,
  itemRepository,
  pathRepository,
  personRepository,
  placeRepository,
  questRepository,
  threadRepository,
} from '../../lib/repositories'
import {
  getThreadDisplayLabel,
  getThreadSubtype,
} from '../../utils/threadSubtype'
import { getEntityTypeFromId } from '../../utils/parseEntityId'
import {
  checkEntityAvailability,
  checkEntityAvailabilityWithReachability,
} from '../../lib/requirements'
import { runForceLayout } from './loomLayout'

/** Data passed to the custom entity node. */
export interface EntityNodeData extends Record<string, unknown> {
  /** Entity type for badge/label. */
  entityType: EntityType

  /** Display name (quest title, item name, etc.). */
  label: string

  /** False when entity is unavailable (requirements or location unreachable); used for styling. */
  available?: boolean

  /** True when this entity is currently actionable; used for emphasis styling. */
  actionable?: boolean

  /**
   * True when this entity is "completed" or resolved for visual purposes
   * (e.g. completed/abandoned quests, acquired/used/lost items, known/irrelevant
   * insights, dead persons). Completed entities are de-emphasized via lower
   * opacity.
   */
  completed?: boolean

  /**
   * True when this entity is hidden by spoiler protection (for now driven by
   * discovery records). When set, type-specific coloring is not shown so the
   * entity type is not revealed; callers may also choose to mask labels.
   */
  spoilerHidden?: boolean
}

/** The width of the layout. */
const LAYOUT_WIDTH = 800

/** The height of the layout. */
const LAYOUT_HEIGHT = 600

/**
 * Loads entities and threads for the current game (and playthrough), builds
 * nodes and edges for React Flow, and runs force-directed layout.
 *
 * @param gameId - Current game ID.
 * @param playthroughId - Current playthrough ID (threads include game-level and this playthrough).
 * @param reachablePlaceIds - Reachable place IDs from current position; when null, all nodes are treated as available.
 * @param actionableEntityIds - Set of actionable entity IDs; those nodes get emphasis styling.
 * @param actionableRouteEdgeIds - Set of thread IDs on shortest routes to actionable nodes; those edges get emphasis styling.
 * @returns Nodes, edges, loading state, and optional error.
 */
export function useLoomGraph(
  gameId: GameId,
  playthroughId: PlaythroughId | null,
  reachablePlaceIds: Set<PlaceId>,
  actionableEntityIds: Set<string>,
  actionableRouteEdgeIds: Set<string>
): {
  nodes: Node<EntityNodeData>[]
  edges: Edge[]
  isLoading: boolean
  error: string | null
} {
  const [nodes, setNodes] = useState<Node<EntityNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reachablePlaceIdsRef = useRef(reachablePlaceIds)
  reachablePlaceIdsRef.current = reachablePlaceIds
  const reachablePlaceIdsKey = useMemo(
    () => Array.from(reachablePlaceIds).sort().join(','),
    [reachablePlaceIds]
  )
  const actionableEntityIdsRef = useRef(actionableEntityIds)
  actionableEntityIdsRef.current = actionableEntityIds
  const actionableEntityIdsKey = useMemo(
    () => Array.from(actionableEntityIds).sort().join(','),
    [actionableEntityIds]
  )
  const actionableRouteEdgeIdsRef = useRef(actionableRouteEdgeIds)
  actionableRouteEdgeIdsRef.current = actionableRouteEdgeIds
  const actionableRouteEdgeIdsKey = useMemo(
    () => Array.from(actionableRouteEdgeIds).sort().join(','),
    [actionableRouteEdgeIds]
  )

  /**
   * Loads the graph data for the current game and playthrough.
   * Reads reachablePlaceIds from a ref so the callback is stable when the Set
   * reference changes but its contents do not; the effect re-runs via
   * reachablePlaceIdsKey when contents change.
   */
  const load = useCallback(async () => {
    if (!gameId) return
    setIsLoading(true)
    setError(null)
    try {
      const [
        quests,
        insights,
        items,
        people,
        places,
        paths,
        threads,
        pathProgress,
        questProgress,
        insightProgress,
        itemState,
        personProgress,
        discoveryRows,
      ] = await Promise.all([
        questRepository.getByGameId(gameId),
        insightRepository.getByGameId(gameId),
        itemRepository.getByGameId(gameId),
        personRepository.getByGameId(gameId),
        placeRepository.getByGameId(gameId),
        pathRepository.getByGameId(gameId),
        threadRepository.getByGameId(gameId, playthroughId),
        playthroughId
          ? pathRepository.getAllProgressForPlaythrough(playthroughId)
          : Promise.resolve([]),
        playthroughId
          ? questRepository.getAllProgressForPlaythrough(playthroughId)
          : Promise.resolve([]),
        playthroughId
          ? insightRepository.getAllProgressForPlaythrough(playthroughId)
          : Promise.resolve([]),
        playthroughId
          ? itemRepository.getAllStateForPlaythrough(playthroughId)
          : Promise.resolve([]),
        playthroughId
          ? personRepository.getAllProgressForPlaythrough(playthroughId)
          : Promise.resolve([]),
        playthroughId
          ? entityDiscoveryRepository.getAllForPlaythrough(playthroughId)
          : Promise.resolve([]),
      ])

      const entityList: {
        id: string
        entityType: EntityType
        label: string
      }[] = []
      quests.forEach((q) =>
        entityList.push({
          id: q.id,
          entityType: EntityType.QUEST,
          label: q.title,
        })
      )
      insights.forEach((i) =>
        entityList.push({
          id: i.id,
          entityType: EntityType.INSIGHT,
          label: i.title,
        })
      )
      items.forEach((i) =>
        entityList.push({
          id: i.id,
          entityType: EntityType.ITEM,
          label: i.name,
        })
      )
      people.forEach((p) =>
        entityList.push({
          id: p.id,
          entityType: EntityType.PERSON,
          label: p.name,
        })
      )
      places.forEach((p) =>
        entityList.push({
          id: p.id,
          entityType: EntityType.PLACE,
          label: p.name,
        })
      )

      paths.forEach((p) =>
        entityList.push({
          id: p.id,
          entityType: EntityType.PATH,
          label: p.name,
        })
      )

      const pathStatusById = new Map<string, PathStatus>()
      for (const row of pathProgress as {
        pathId: string
        status: PathStatus
      }[]) {
        pathStatusById.set(row.pathId, row.status)
      }

      const pathAvailabilityById = new Map<string, boolean>()
      if (playthroughId) {
        const results = await Promise.all(
          paths.map(async (p) => {
            const availability = await checkEntityAvailability(
              gameId,
              playthroughId,
              p.id
            )
            return { id: p.id, available: availability.available }
          })
        )
        for (const r of results) {
          pathAvailabilityById.set(r.id, r.available)
        }
      }

      const entityAvailabilityById = new Map<string, boolean>()
      const currentReachable = reachablePlaceIdsRef.current
      if (playthroughId && currentReachable) {
        const results = await Promise.all(
          entityList.map(async (e) => {
            const available = await checkEntityAvailabilityWithReachability(
              gameId,
              playthroughId,
              e.id,
              currentReachable
            )
            return { id: e.id, available }
          })
        )
        for (const r of results) {
          entityAvailabilityById.set(r.id, r.available)
        }
      }

      /**
       * Checks if a path is traversable.
       *
       * @param pathId - The ID of the path to check.
       * @returns True if the path is traversable, false otherwise.
       */
      const getPathTraversable = (pathId: string): boolean => {
        const status = pathStatusById.get(pathId) ?? PathStatus.RESTRICTED
        if (status === PathStatus.BLOCKED) {
          return false
        }
        if (status === PathStatus.OPENED) {
          return true
        }
        // RESTRICTED: requires requirements to be satisfied; without a playthrough
        // context we cannot evaluate, so treat as not traversable.
        if (!playthroughId) {
          return false
        }
        return pathAvailabilityById.get(pathId) ?? false
      }

      const nodeIds = entityList.map((e) => e.id)
      const idToEntity = new Map(entityList.map((e) => [e.id, e]))

      // Map entity IDs to a "completed-like" visual state based on their
      // playthrough-scoped statuses. These are intentionally coarse-grained:
      // quests that are completed or abandoned, items that are acquired, used, or lost,
      // insights that are known or irrelevant, and people who are dead are all
      // treated as visually completed so they recede in the Loom.
      const completedById = new Map<string, boolean>()

      if (playthroughId) {
        for (const row of questProgress as {
          questId: string
          status: QuestStatus
        }[]) {
          if (
            row.status === QuestStatus.COMPLETED ||
            row.status === QuestStatus.ABANDONED
          ) {
            completedById.set(row.questId, true)
          }
        }

        for (const row of insightProgress as {
          insightId: string
          status: InsightStatus
        }[]) {
          if (
            row.status === InsightStatus.KNOWN ||
            row.status === InsightStatus.IRRELEVANT
          ) {
            completedById.set(row.insightId, true)
          }
        }

        for (const row of itemState as {
          itemId: string
          status: ItemStatus
        }[]) {
          if (
            row.status === ItemStatus.ACQUIRED ||
            row.status === ItemStatus.USED ||
            row.status === ItemStatus.LOST
          ) {
            completedById.set(row.itemId, true)
          }
        }

        for (const row of personProgress as {
          personId: string
          status: PersonStatus
        }[]) {
          if (row.status === PersonStatus.DEAD) {
            completedById.set(row.personId, true)
          }
        }
      }

      // Map entity IDs to spoiler-hidden state based on discovery records.
      // Only explicit discovered: false rows are treated as hidden; absence of
      // a record defaults to "visible" so existing content is unaffected until
      // discovery rules are wired in.
      const spoilerHiddenById = new Map<string, boolean>()
      for (const row of discoveryRows as { entityId: string; discovered: boolean }[]) {
        if (!row.discovered) {
          spoilerHiddenById.set(row.entityId, true)
        }
      }

      const links = threads
        .filter((t) => idToEntity.has(t.sourceId) && idToEntity.has(t.targetId))
        .map((t) => ({ source: t.sourceId, target: t.targetId }))

      const positions = runForceLayout(
        nodeIds,
        links,
        LAYOUT_WIDTH,
        LAYOUT_HEIGHT
      )

      const flowNodes: Node<EntityNodeData>[] = entityList.map((e) => {
        const pos = positions.get(e.id) ?? { x: 0, y: 0 }
        const available = entityAvailabilityById.has(e.id)
          ? entityAvailabilityById.get(e.id)
          : true
        const completed = completedById.get(e.id) ?? false
        const spoilerHidden = spoilerHiddenById.get(e.id) ?? false
        return {
          id: e.id,
          type: 'entityNode',
          position: { x: pos.x, y: pos.y },
          data: {
            entityType: e.entityType,
            label: e.label || 'Unnamed',
            available,
            actionable: actionableEntityIdsRef.current.has(e.id),
            completed,
            spoilerHidden,
          },
        }
      })

      const flowEdges: Edge[] = threads
        .filter((t) => idToEntity.has(t.sourceId) && idToEntity.has(t.targetId))
        .map((t) => {
          const subtype = getThreadSubtype(t)
          const isRequires = subtype === ThreadSubtype.REQUIRES
          const isObjectiveReq = subtype === ThreadSubtype.OBJECTIVE_REQUIRES
          const isDirectPlaceLink = subtype === ThreadSubtype.DIRECT_PLACE_LINK
          const isConnectsPath = subtype === ThreadSubtype.CONNECTS_PATH
          const displayLabel = getThreadDisplayLabel(t) || undefined

          const sourceType = getEntityTypeFromId(t.sourceId)
          const targetType = getEntityTypeFromId(t.targetId)

          let traversable = false
          if (isDirectPlaceLink) {
            traversable =
              sourceType === EntityType.PLACE && targetType === EntityType.PLACE
          } else if (isConnectsPath) {
            const pathEndpoint =
              sourceType === EntityType.PATH
                ? t.sourceId
                : targetType === EntityType.PATH
                  ? t.targetId
                  : null
            if (pathEndpoint) {
              traversable = getPathTraversable(pathEndpoint)
            }
          }

          const style: React.CSSProperties = {}

          if (isRequires || isObjectiveReq) {
            style.strokeDasharray = isRequires ? '8,4' : '2,3'
          }

          if (isDirectPlaceLink || isConnectsPath) {
            style.stroke = traversable ? '#0f766e' : '#cbd5f5'
            style.opacity = traversable ? 0.95 : 0.5
          }

          const isActionableRoute = actionableRouteEdgeIdsRef.current.has(t.id)
          if (isActionableRoute) {
            style.stroke = '#14b8a6'
            style.strokeWidth = 3
            style.opacity = 1
          }

          return {
            id: t.id,
            source: t.sourceId,
            target: t.targetId,
            label: displayLabel,
            type: 'default',
            pathOptions: { curvature: 0.1 },
            ...(Object.keys(style).length > 0 && { style }),
          }
        })

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loom')
      setNodes([])
      setEdges([])
    } finally {
      setIsLoading(false)
    }
  }, [gameId, playthroughId])

  useEffect(() => {
    load()
  }, [load, reachablePlaceIdsKey, actionableEntityIdsKey, actionableRouteEdgeIdsKey])

  return { nodes, edges, isLoading, error }
}
