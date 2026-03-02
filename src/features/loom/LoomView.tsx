/**
 * Loom (graph) view: React Flow canvas showing entities as nodes and threads as edges.
 * Replaces the Threads tab content. Uses d3-force for layout; supports node/edge selection and focus.
 */

import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  getConnectedEdges,
  Panel,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef } from 'react'
import type { GameId, PlaceId, PlaythroughId } from '../../types/ids'
import { EntityNode } from './EntityNode'
import { useLoomGraph } from './useLoomGraph'

/** Custom node types for the Loom. */
const nodeTypes = { entityNode: EntityNode }

/**
 * Props for the LoomView component.
 */
export interface LoomViewProps {
  /** Current game ID. */
  gameId: GameId

  /** Current playthrough ID (threads include game-level and this playthrough). */
  playthroughId: PlaythroughId | null

  /** Reachable place IDs from current position (for node availability styling). */
  reachablePlaceIds: Set<PlaceId>

  /** Set of thread IDs on actionable routes (for edge emphasis styling). */
  actionableRouteEdgeIds: Set<string>
}

/**
 * Inner Loom content (must be under ReactFlowProvider to use useReactFlow / store).
 */
function LoomContent({
  gameId,
  playthroughId,
  reachablePlaceIds,
  actionableRouteEdgeIds,
}: LoomViewProps): JSX.Element {
  const {
    nodes: initialNodes,
    edges: initialEdges,
    isLoading,
    error,
  } = useLoomGraph(
    gameId,
    playthroughId,
    reachablePlaceIds,
    actionableRouteEdgeIds
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { fitView } = useReactFlow()
  const prevLoading = useRef(true)

  // Sync when graph data finishes loading (e.g. game/playthrough change)
  useEffect(() => {
    if (prevLoading.current && !isLoading) {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
    prevLoading.current = isLoading
  }, [isLoading, initialNodes, initialEdges, setNodes, setEdges])

  // Sync edge selection whenever node selection changes (so connected edges highlight)
  useEffect(() => {
    const selectedNodes = nodes.filter((n) => n.selected)
    if (selectedNodes.length === 0) {
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
      return
    }
    setEdges((eds) => {
      const connected = getConnectedEdges(selectedNodes, eds)
      const connectedIds = new Set(connected.map((e) => e.id))
      return eds.map((e) => ({ ...e, selected: connectedIds.has(e.id) }))
    })
  }, [nodes, setEdges])

  /**
   * Handles the click event on an edge.
   *
   * @param _event - The mouse event.
   * @param edge - The edge that was clicked.
   */
  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, clickedEdge: Edge): void => {
      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          selected:
            node.id === clickedEdge.source || node.id === clickedEdge.target,
        }))
      )
      setEdges((edges) =>
        edges.map((e) => ({ ...e, selected: e.id === clickedEdge.id }))
      )
    },
    [setNodes, setEdges]
  )

  /**
   * Fits the view to the nodes.
   */
  useEffect(() => {
    if (nodes.length > 0) fitView({ padding: 0.2, duration: 0 })
  }, [nodes.length, fitView])

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-slate-500">
        Loading loom…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center text-red-600">
        {error}
      </div>
    )
  }

  if (nodes.length === 0 && edges.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-slate-500">
        <p>No entities or threads yet.</p>
        <p className="text-sm">
          Add quests, people, places, and link them from their Connections.
        </p>
      </div>
    )
  }

  return (
    <div className="loom-flow h-full min-h-[400px] w-full">
      <ReactFlow
        className="loom-flow__canvas"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesConnectable={false}
        nodesDraggable
        elementsSelectable
        proOptions={{ hideAttribution: true }}
      />
      <Panel position="top-right">
        <button
          type="button"
          onClick={() => fitView({ padding: 0.2 })}
          className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-600 shadow hover:bg-slate-50"
        >
          Fit view
        </button>
      </Panel>
    </div>
  )
}

/**
 * Loom view: graph of entities (nodes) and threads (edges) for the current game.
 * Rendered when the user selects the Loom tab in the game view.
 *
 * @param props.gameId - Current game ID.
 * @param props.playthroughId - Current playthrough ID.
 * @returns A JSX element representing the LoomView component.
 */
export function LoomView({
  gameId,
  playthroughId,
  reachablePlaceIds,
  actionableRouteEdgeIds,
}: LoomViewProps): JSX.Element {
  return (
    <ReactFlowProvider>
      <LoomContent
        gameId={gameId}
        playthroughId={playthroughId}
        reachablePlaceIds={reachablePlaceIds}
        actionableRouteEdgeIds={actionableRouteEdgeIds}
      />
    </ReactFlowProvider>
  )
}
