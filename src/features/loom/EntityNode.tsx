/**
 * Custom React Flow node for Loom entity (quest, insight, item, person, place, map).
 * Shows entity type badge and display name. Handles are centered so edges connect node-to-node
 * at the middle of each node (omni-directional); they are invisible and for connection only.
 */

import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'
import { ENTITY_TYPE_LABELS } from '../../utils/entityTypeLabels'
import type { EntityNodeData } from './useLoomGraph'

/** Entity node type for Loom (custom data). */
type EntityNodeType = Node<EntityNodeData>

/** Invisible, centered handle so edges connect to node center (no Position.Center in API). */
const centerHandleStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  opacity: 0,
  width: 1,
  height: 1,
  minWidth: 1,
  minHeight: 1,
  border: 'none',
  padding: 0,
}

/**
 * Renders a single entity as a Loom node: type badge + label.
 * Source and target Handles are placed at the node center so edges connect center-to-center.
 *
 * @param props - React Flow node props; data contains entityType and label.
 * @returns A JSX element representing the EntityNode component.
 */
function EntityNodeComponent({
  data,
  selected,
}: NodeProps<EntityNodeType>): JSX.Element {
  const { entityType, label, available = true } = data
  const typeLabel = ENTITY_TYPE_LABELS[entityType] ?? 'Entity'

  return (
    <div
      className={`relative rounded border px-3 py-2 shadow-sm ${
        available
          ? 'bg-white border-slate-200 hover:border-slate-300'
          : 'border-slate-200 bg-slate-100 opacity-60'
      } ${selected ? 'border-slate-400 ring-2 ring-slate-300' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={centerHandleStyle}
        className="!border-0"
      />
      <Handle
        type="source"
        position={Position.Top}
        style={centerHandleStyle}
        className="!border-0"
      />
      <div
        className={`text-[10px] font-medium uppercase tracking-wide ${
          available ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        {typeLabel}
      </div>
      <div
        className={`max-w-[140px] truncate text-sm font-medium ${
          available ? 'text-slate-800' : 'text-slate-500'
        }`}
      >
        {label}
      </div>
    </div>
  )
}

export const EntityNode = memo(EntityNodeComponent)
