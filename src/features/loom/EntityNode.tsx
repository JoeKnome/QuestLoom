/**
 * Custom React Flow node for Loom entity (quest, insight, item, person, place, map).
 * Shows entity type badge and display name. Handles are centered so edges connect node-to-node
 * at the middle of each node (omni-directional); they are invisible and for connection only.
 */

import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import { memo } from 'react'
import { ENTITY_TYPE_LABELS } from '../../utils/entityTypeLabels'
import { getEntityTypeColorClasses } from '../../utils/entityTypeColors'
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
  const { entityType, label, available = true, actionable = false } = data
  const typeLabel = ENTITY_TYPE_LABELS[entityType] ?? 'Entity'
  const colorClasses = getEntityTypeColorClasses(entityType)
  const baseColorClasses = available ? colorClasses : 'bg-slate-200 text-slate-500'
  const isEmphasized = actionable && available
  const borderClasses = isEmphasized ? 'border-4 border-teal-500' : 'border-0'
  const selectionClasses = selected ? 'scale-110' : ''
  const availabilityClasses = available ? '' : 'opacity-60'

  return (
    <div
      className={`relative rounded px-3 py-2 shadow-sm ${baseColorClasses} ${availabilityClasses} ${borderClasses} ${selectionClasses}`}
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
      <div className="flex flex-col gap-0.5">
        <div className="text-[10px] font-medium uppercase tracking-wide">
          {typeLabel}
        </div>
        <div className="max-w-[160px] truncate text-sm font-medium">
          {label}
        </div>
      </div>
    </div>
  )
}

export const EntityNode = memo(EntityNodeComponent)
