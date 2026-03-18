import { useState } from 'react'
import { useCloudStore } from '../store/cloud'
import type { CloudNode } from '../types/cloud'

interface InspectorProps {
  onDelete: (node: CloudNode) => void
  onEdit: (node: CloudNode) => void
  onQuickAction: (node: CloudNode, action: 'stop' | 'start' | 'reboot' | 'invalidate', meta?: { path?: string }) => void
}

export function Inspector({ onDelete, onEdit, onQuickAction }: InspectorProps){
  const selectedId = useCloudStore((s) => s.selectedNodeId)
  const nodes      = useCloudStore((s) => s.nodes)
  const node       = nodes.find((n) => n.id === selectedId)

  const [invalidatePath, setInvalidatePath] = useState('/*')
  const [acmDeleteError, setAcmDeleteError] = useState<string | null>(null)

  const STATUS_COLORS: Record<string, string> = {
    running: '#28c840', stopped: '#ff5f57', pending: '#febc2e', error: '#ff5f57', unknown: '#666',
  }

  const btnBase: React.CSSProperties = {
    flex: 1, background: 'var(--cb-bg-elevated)', borderRadius: 2,
    padding: '3px 0', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer',
  }

  return (
    <div
      className="w-44 flex-shrink-0 p-2 overflow-y-auto"
      style={{ background: 'var(--cb-bg-panel)', borderLeft: '1px solid var(--cb-border-strong)', fontFamily: 'monospace' }}
    >
      {!node ? (
        <div className="text-[9px] text-center mt-8" style={{ color: 'var(--cb-text-muted)' }}>
          Click a resource to inspect
        </div>
      ) : (
        <>
          <div className="text-[9px] font-bold mb-2 pb-1" style={{ color: 'var(--cb-accent)', borderBottom: '1px solid var(--cb-border-strong)' }}>
            {node.type.toUpperCase()}  ·  Selected
          </div>

          {[
            { key: 'ID',     val: node.id },
            { key: 'NAME',   val: node.label },
            { key: 'REGION', val: node.region },
          ].map(({ key, val }) => (
            <div key={key} className="mb-2">
              <div className="text-[8px] mb-0.5" style={{ color: 'var(--cb-text-muted)' }}>{key}</div>
              <div className="text-[9px] break-all" style={{ color: 'var(--cb-text-primary)' }}>{val}</div>
            </div>
          ))}

          <div className="mb-2">
            <div className="text-[8px] mb-0.5" style={{ color: 'var(--cb-text-muted)' }}>STATE</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[node.status] ?? '#666' }} />
              <span className="text-[9px]" style={{ color: STATUS_COLORS[node.status] ?? '#666' }}>{node.status}</span>
            </div>
          </div>

          {/* ACM-specific metadata */}
          {node.type === 'acm' && (
            <div>
              <div className="text-[8px] mb-1 mt-2" style={{ color: 'var(--cb-text-muted)', borderTop: '1px solid var(--cb-border-strong)', paddingTop: '6px' }}>
                METADATA
              </div>
              {[
                { k: 'domainName',        v: node.metadata.domainName as string },
                { k: 'validationMethod',  v: node.metadata.validationMethod as string },
                { k: 'inUseBy',           v: `${(node.metadata.inUseBy as string[]).length} resource(s)` },
              ].map(({ k, v }) => (
                <div key={k} className="mb-1.5">
                  <div className="text-[7px]" style={{ color: 'var(--cb-text-muted)' }}>{k}</div>
                  <div className="text-[8px] break-all" style={{ color: 'var(--cb-text-secondary)' }}>{v ?? '—'}</div>
                </div>
              ))}

              {/* CNAME records for pending DNS validation */}
              {node.status === 'pending' && (node.metadata.cnameRecords as Array<{ name: string; value: string }>).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="text-[8px] mb-1" style={{ color: 'var(--cb-text-muted)', textTransform: 'uppercase' }}>DNS Validation CNAMEs</div>
                  {(node.metadata.cnameRecords as Array<{ name: string; value: string }>).map((rec, i) => (
                    <div key={i} style={{ marginBottom: 6, fontSize: 8 }}>
                      <div style={{ color: 'var(--cb-text-muted)', marginBottom: 1 }}>Name</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--cb-text-secondary)', wordBreak: 'break-all', flex: 1 }}>{rec.name}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(rec.name)}
                          style={{ ...btnBase, flex: 'none', padding: '1px 4px', border: '1px solid var(--cb-border)', color: 'var(--cb-text-muted)', fontSize: 8 }}
                        >⎘</button>
                      </div>
                      <div style={{ color: 'var(--cb-text-muted)', marginBottom: 1, marginTop: 3 }}>Value</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: 'var(--cb-text-secondary)', wordBreak: 'break-all', flex: 1 }}>{rec.value}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(rec.value)}
                          style={{ ...btnBase, flex: 'none', padding: '1px 4px', border: '1px solid var(--cb-border)', color: 'var(--cb-text-muted)', fontSize: 8 }}
                        >⎘</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {acmDeleteError && (
                <div style={{ marginTop: 6, fontSize: 8, color: '#ff5f57' }}>{acmDeleteError}</div>
              )}

              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button
                  onClick={() => {
                    const inUseBy = node.metadata.inUseBy as string[]
                    if (inUseBy.length > 0) {
                      setAcmDeleteError(`Cannot delete: in use by ${inUseBy.length} resource(s)`)
                      return
                    }
                    setAcmDeleteError(null)
                    onDelete(node)
                  }}
                  style={{ ...btnBase, border: '1px solid #ff5f57', color: '#ff5f57' }}
                >
                  ✕ Delete
                </button>
              </div>
            </div>
          )}

          {/* CloudFront-specific metadata */}
          {node.type === 'cloudfront' && (
            <div>
              <div className="text-[8px] mb-1 mt-2" style={{ color: 'var(--cb-text-muted)', borderTop: '1px solid var(--cb-border-strong)', paddingTop: '6px' }}>
                METADATA
              </div>
              {[
                { k: 'domainName',   v: node.metadata.domainName as string },
                { k: 'origins',      v: `${(node.metadata.origins as unknown[]).length} origin(s)` },
                { k: 'priceClass',   v: node.metadata.priceClass as string },
                { k: 'certArn',      v: (node.metadata.certArn as string | undefined) ?? 'default' },
                { k: 'rootObject',   v: (node.metadata.defaultRootObject as string) || '—' },
              ].map(({ k, v }) => (
                <div key={k} className="mb-1.5">
                  <div className="text-[7px]" style={{ color: 'var(--cb-text-muted)' }}>{k}</div>
                  <div className="text-[8px] break-all" style={{ color: 'var(--cb-text-secondary)' }}>{v}</div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button
                  onClick={() => onEdit(node)}
                  style={{ ...btnBase, border: '1px solid #64b5f6', color: '#64b5f6' }}
                >
                  ✎ Edit
                </button>
                <button
                  onClick={() => onDelete(node)}
                  style={{ ...btnBase, border: '1px solid #ff5f57', color: '#ff5f57' }}
                >
                  ✕ Delete
                </button>
              </div>

              {/* Invalidate cache quick action */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 8, color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Invalidate Cache</div>
                <input
                  value={invalidatePath}
                  onChange={(e) => setInvalidatePath(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--cb-bg-panel)', border: '1px solid var(--cb-border)',
                    borderRadius: 2, padding: '2px 5px', color: 'var(--cb-text-primary)',
                    fontFamily: 'monospace', fontSize: 9, boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={() => onQuickAction(node, 'invalidate', { path: invalidatePath })}
                  style={{ ...btnBase, border: '1px solid #a78bfa', color: '#a78bfa', width: '100%', marginTop: 4 }}
                >
                  Invalidate
                </button>
              </div>
            </div>
          )}

          {/* Default metadata + buttons for all other node types */}
          {node.type !== 'acm' && node.type !== 'cloudfront' && (
            <>
              {Object.entries(node.metadata).length > 0 && (
                <div>
                  <div className="text-[8px] mb-1 mt-2" style={{ color: 'var(--cb-text-muted)', borderTop: '1px solid var(--cb-border-strong)', paddingTop: '6px' }}>
                    METADATA
                  </div>
                  {Object.entries(node.metadata).slice(0, 6).map(([k, v]) => (
                    <div key={k} className="mb-1.5">
                      <div className="text-[7px]" style={{ color: 'var(--cb-text-muted)' }}>{k}</div>
                      <div className="text-[8px] break-all" style={{ color: 'var(--cb-text-secondary)' }}>{String(v ?? '—')}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                <button
                  onClick={() => onEdit(node)}
                  style={{ ...btnBase, border: '1px solid #64b5f6', color: '#64b5f6' }}
                >
                  ✎ Edit
                </button>
                <button
                  onClick={() => onDelete(node)}
                  style={{ ...btnBase, border: '1px solid #ff5f57', color: '#ff5f57' }}
                >
                  ✕ Delete
                </button>
              </div>

              {(node.type === 'ec2' || node.type === 'rds') && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 8, color: 'var(--cb-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Quick actions</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {node.status !== 'stopped' && (
                      <button onClick={() => onQuickAction(node, 'stop')}
                        style={{ background: 'var(--cb-bg-elevated)', border: '1px solid #febc2e', borderRadius: 2, padding: '2px 8px', color: '#febc2e', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
                        Stop
                      </button>
                    )}
                    {node.status === 'stopped' && (
                      <button onClick={() => onQuickAction(node, 'start')}
                        style={{ background: 'var(--cb-bg-elevated)', border: '1px solid #28c840', borderRadius: 2, padding: '2px 8px', color: '#28c840', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
                        Start
                      </button>
                    )}
                    <button onClick={() => onQuickAction(node, 'reboot')}
                      style={{ background: 'var(--cb-bg-elevated)', border: '1px solid #64b5f6', borderRadius: 2, padding: '2px 8px', color: '#64b5f6', fontFamily: 'monospace', fontSize: 9, cursor: 'pointer' }}>
                      Reboot
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
