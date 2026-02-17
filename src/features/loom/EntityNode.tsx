/**
 * Custom React Flow node for Loom entity (quest, insight, item, person, place, map).
 * Shows entity type badge and display name. Includes Handle components so edges can attach.
 */

import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'
import { ENTITY_TYPE_LABELS } from '../../utils/entityTypeLabels'
import type { EntityNodeData } from './useLoomGraph'

/** Entity node type for Loom (custom data). */
type EntityNodeType = Node<EntityNodeData>

/**
 * Renders a single entity as a Loom node: type badge + label.
 * Source and target Handles allow edges to connect; without them edges do not render.
 *
 * @param props - React Flow node props; data contains entityType and label.
 * @returns A JSX element representing the EntityNode component.
 */
function EntityNodeComponent({
  data,
  selected,
}: NodeProps<EntityNodeType>): JSX.Element {
  const { entityType, label } = data
  const typeLabel = ENTITY_TYPE_LABELS[entityType] ?? 'Entity'

  return (
    <div
      className={`rounded border bg-white px-3 py-2 shadow-sm ${
        selected
          ? 'border-slate-400 ring-2 ring-slate-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!border-slate-300 !bg-white" />
      <Handle type="source" position={Position.Top} className="!border-slate-300 !bg-white" />
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {typeLabel}
      </div>
      <div className="max-w-[140px] truncate text-sm font-medium text-slate-800">
        {label}
      </div>
    </div>
  )
}

export const EntityNode = memo(EntityNodeComponent)
