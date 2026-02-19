/**
 * Loads game entities and threads, maps them to React Flow nodes and edges,
 * and runs d3-force layout. Used by LoomView.
 */

import { useCallback, useEffect, useState } from 'react'
import type { Edge, Node } from '@xyflow/react'
import { EntityType } from '../../types/EntityType'
import type { GameId, PlaythroughId } from '../../types/ids'
import {
  insightRepository,
  itemRepository,
  personRepository,
  placeRepository,
  questRepository,
  threadRepository,
} from '../../lib/repositories'
import { runForceLayout } from './loomLayout'

/** Data passed to the custom entity node. */
export interface EntityNodeData extends Record<string, unknown> {
  /** Entity type for badge/label. */
  entityType: EntityType
  /** Display name (quest title, item name, etc.). */
  label: string
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
 * @returns Nodes, edges, loading state, and optional error.
 */
export function useLoomGraph(
  gameId: GameId,
  playthroughId: PlaythroughId | null
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

  /**
   * Loads the graph data for the current game and playthrough.
   */
  const load = useCallback(async () => {
    if (!gameId) return
    setIsLoading(true)
    setError(null)
    try {
      const [quests, insights, items, people, places, threads] =
        await Promise.all([
          questRepository.getByGameId(gameId),
          insightRepository.getByGameId(gameId),
          itemRepository.getByGameId(gameId),
          personRepository.getByGameId(gameId),
          placeRepository.getByGameId(gameId),
          threadRepository.getByGameId(gameId, playthroughId),
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

      const nodeIds = entityList.map((e) => e.id)
      const idToEntity = new Map(entityList.map((e) => [e.id, e]))

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
        return {
          id: e.id,
          type: 'entityNode',
          position: { x: pos.x, y: pos.y },
          data: {
            entityType: e.entityType,
            label: e.label || 'Unnamed',
          },
        }
      })

      const flowEdges: Edge[] = threads
        .filter((t) => idToEntity.has(t.sourceId) && idToEntity.has(t.targetId))
        .map((t) => ({
          id: t.id,
          source: t.sourceId,
          target: t.targetId,
          label: t.label || undefined,
          type: 'default',
          pathOptions: { curvature: 0.1 },
        }))

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
  }, [load])

  return { nodes, edges, isLoading, error }
}
