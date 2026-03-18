import type { NodeProps } from '@xyflow/react'

interface ApigwNodeData {
  label: string
  endpoint?: string
}

export function ApigwNode({ data }: NodeProps) {
  const d = data as unknown as ApigwNodeData
  return (
    <div
      style={{
        background:   'rgba(139, 92, 246, 0.04)',
        border:       '1px solid rgba(139, 92, 246, 0.5)',
        borderRadius: 8,
        minWidth:     240,
        minHeight:    80,
        fontFamily:   'monospace',
        overflow:     'hidden',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background:   'rgba(139, 92, 246, 0.12)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
          padding:      '5px 10px',
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          height:       32,
          boxSizing:    'border-box',
        }}
      >
        <span style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em' }}>
          ⚡ API GW
        </span>
        <span style={{ color: '#c4b5fd', fontSize: 10, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.label}
        </span>
      </div>
    </div>
  )
}
