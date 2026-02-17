/**
 * Runs d3-force simulation to compute node positions for an undirected graph.
 * Used by the Loom view so related entities cluster naturally (relationship-focused, not hierarchical).
 */

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from 'd3-force'

/**
 * Mutable node shape used by d3-force (x, y are updated by the simulation).
 */
export interface D3ForceNode {
  /** The node ID. */
  id: string
  /** The node X position. */
  x: number
  /** The node Y position. */
  y: number
  /** The node X velocity. */
  vx?: number
  /** The node Y velocity. */
  vy?: number
}

/**
 * Link shape for d3-force (source and target are node references after initialization).
 */
export interface D3ForceLink {
  /** The source node. */
  source: string | D3ForceNode
  /** The target node. */
  target: string | D3ForceNode
}

/**
 * Runs a force-directed layout and returns positions keyed by node id.
 *
 * @param nodeIds - Ordered list of node ids (same order as used for links by index).
 * @param links - Links as { source: sourceId, target: targetId }.
 * @param width - Canvas width for centering (default 800).
 * @param height - Canvas height for centering (default 600).
 * @returns Map of node id to { x, y }.
 */
export function runForceLayout(
  nodeIds: string[],
  links: { source: string; target: string }[],
  width = 800,
  height = 600
): Map<string, { x: number; y: number }> {
  if (nodeIds.length === 0) {
    return new Map()
  }

  const nodes: D3ForceNode[] = nodeIds.map((id) => ({
    id,
    x: 0,
    y: 0,
  }))

  const nodeIdSet = new Set(nodeIds)
  const d3Links = links.filter(
    (l) => nodeIdSet.has(l.source) && nodeIdSet.has(l.target)
  )

  const simulation = forceSimulation(
    nodes as unknown as { x: number; y: number }[]
  )
    .force(
      'link',
      forceLink(d3Links)
        .id((d) => (d as D3ForceNode).id)
        .distance(140)
    )
    .force('charge', forceManyBody().strength(-90))
    .force(
      'collide',
      forceCollide().radius(36).strength(0.8)
    )
    .force('center', forceCenter(width / 2, height / 2))

  // Run simulation synchronously for a fixed number of ticks
  for (let i = 0; i < 350; i++) {
    simulation.tick()
  }
  simulation.stop()

  const result = new Map<string, { x: number; y: number }>()
  nodes.forEach((n) => {
    result.set(n.id, { x: n.x, y: n.y })
  })
  return result
}
