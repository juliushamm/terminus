import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { NodeStatus } from '../../../types/cloud'

const STATUS_COLORS: Record<NodeStatus, string> = {
  running:  '#28c840',
  stopped:  '#ff5f57',
  pending:  '#febc2e',
  error:    '#ff5f57',
  unknown:  '#666666',
  creating: '#febc2e',
}

const BORDER_COLOR = '#a78bfa'   // CloudFront: violet / edge purple

interface CloudFrontNodeData {
  label:  string
  status: NodeStatus
}

export function CloudFrontNode({ data, selected }: NodeProps) {
  const d = data as unknown as CloudFrontNodeData
  const statusColor = STATUS_COLORS[d.status] ?? '#666'

  return (
    <div
      data-selected={selected}
      className="relative rounded"
      style={{
        background: 'var(--cb-bg-panel)',
        border:     `${selected ? '2px' : '1px'} solid ${BORDER_COLOR}`,
        boxShadow:  selected ? `0 0 10px ${BORDER_COLOR}55` : 'none',
        fontFamily: 'monospace',
        minWidth:   130,
        padding:    '6px 10px 6px 10px',
      }}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left}   style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right}  style={{ opacity: 0 }} />

      <div className="flex items-center justify-between mb-1">
        <span
          className="text-[9px] font-bold tracking-wider"
          style={{ color: BORDER_COLOR, opacity: 0.85 }}
        >
          CF
        </span>
        <span
          data-status={d.status}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: statusColor }}
        />
      </div>

      <div
        className="text-[11px] font-medium leading-tight"
        style={{ color: 'var(--cb-text-primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {d.label}
      </div>
    </div>
  )
}
