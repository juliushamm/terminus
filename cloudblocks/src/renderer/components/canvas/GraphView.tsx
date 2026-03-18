import { useMemo } from 'react'
import { ReactFlow, Background, MiniMap, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCloudStore } from '../../store/cloud'
import { ResourceNode } from './nodes/ResourceNode'
import { AcmNode } from './nodes/AcmNode'
import { CloudFrontNode } from './nodes/CloudFrontNode'
import type { CloudNode } from '../../types/cloud'

const NODE_TYPES = { resource: ResourceNode, acm: AcmNode, cloudfront: CloudFrontNode }

// Distinct colors per VPC — cycles if more than 6 VPCs
const VPC_PALETTE = ['#1976D2', '#9c27b0', '#0891b2', '#16a34a', '#ea580c', '#e11d48']

// Walk up parentId chain to find the VPC ancestor (type === 'vpc')
function findVpcAncestor(node: CloudNode, byId: Map<string, CloudNode>): CloudNode | null {
  let current: CloudNode | undefined = node
  while (current) {
    if (current.type === 'vpc') return current
    if (!current.parentId) return null
    current = byId.get(current.parentId)
  }
  return null
}

function deriveEdges(nodes: CloudNode[]): Edge[] {
  const edges: Edge[] = []

  // Parent → child edges
  nodes
    .filter((n) => n.parentId)
    .forEach((n) => {
      edges.push({
        id:     `${n.parentId}-${n.id}`,
        source: n.parentId!,
        target: n.id,
        type:   'step',
        style:  { stroke: 'var(--cb-border-strong)', strokeWidth: 1.5 },
      })
    })

  // CloudFront → origin edges + CloudFront → ACM cert edges
  const s3Nodes  = nodes.filter((n) => n.type === 's3')
  const albNodes = nodes.filter((n) => n.type === 'alb')
  const acmNodes = nodes.filter((n) => n.type === 'acm')
  const cfNodes  = nodes.filter((n) => n.type === 'cloudfront')

  cfNodes.forEach((cf) => {
    const origins = (cf.metadata.origins ?? []) as Array<{ id: string; domainName: string; type: string }>

    // Origin edges
    origins.forEach((origin) => {
      const s3Match = s3Nodes.find((s) => origin.domainName.startsWith(s.id + '.'))
      if (s3Match) {
        edges.push({
          id:     `cf-origin-${cf.id}-${s3Match.id}`,
          source: cf.id,
          target: s3Match.id,
          type:   'step',
          style:  { stroke: 'var(--cb-border-strong)', strokeWidth: 1.5 },
        })
        return
      }
      const albMatch = albNodes.find((a) => origin.domainName === (a.metadata.dnsName as string))
      if (albMatch) {
        edges.push({
          id:     `cf-origin-${cf.id}-${albMatch.id}`,
          source: cf.id,
          target: albMatch.id,
          type:   'step',
          style:  { stroke: 'var(--cb-border-strong)', strokeWidth: 1.5 },
        })
      }
    })

    // Cert edge (dotted)
    const certArn = cf.metadata.certArn as string | undefined
    if (certArn) {
      const certNode = acmNodes.find((a) => a.id === certArn)
      if (certNode) {
        edges.push({
          id:     `cf-cert-${cf.id}`,
          source: cf.id,
          target: certNode.id,
          type:   'step',
          style:  { stroke: 'var(--cb-border)', strokeDasharray: '4 2', strokeWidth: 1 },
          label:  'cert',
        })
      }
    }
  })

  return edges
}

interface GraphViewProps {
  onNodeContextMenu: (node: CloudNode, x: number, y: number) => void
}

export function GraphView({ onNodeContextMenu }: GraphViewProps){
  const cloudNodes   = useCloudStore((s) => s.nodes)
  const pendingNodes = useCloudStore((s) => s.pendingNodes)
  const selectNode   = useCloudStore((s) => s.selectNode)
  const selectedId   = useCloudStore((s) => s.selectedNodeId)

  const allNodes = useMemo(() => [...cloudNodes, ...pendingNodes], [cloudNodes, pendingNodes])

  const byId = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes])

  const vpcColorMap = useMemo(() => {
    const map = new Map<string, string>()
    let idx = 0
    allNodes.forEach((n) => {
      if (n.type === 'vpc' && !map.has(n.id)) {
        map.set(n.id, VPC_PALETTE[idx % VPC_PALETTE.length])
        idx++
      }
    })
    return map
  }, [allNodes])

  const flowNodes: Node[] = useMemo(
    () => allNodes.map((n, i) => {
      const vpc      = findVpcAncestor(n, byId)
      const vpcColor = vpc ? (vpcColorMap.get(vpc.id) ?? undefined) : undefined
      const vpcLabel = vpc ? vpc.label : undefined

      // Use dedicated node types for ACM + CloudFront
      const rfType = n.type === 'acm' ? 'acm' : n.type === 'cloudfront' ? 'cloudfront' : 'resource'

      return {
        id:       n.id,
        type:     rfType,
        position: { x: (i % 5) * 175 + 40, y: Math.floor(i / 5) * 110 + 60 },
        data:     {
          label:    n.label,
          nodeType: n.type,
          status:   n.status,
          vpcLabel: n.type !== 'vpc' && n.type !== 'subnet' ? vpcLabel : undefined,
          vpcColor: n.type !== 'vpc' && n.type !== 'subnet' ? vpcColor : undefined,
        },
        selected: n.id === selectedId,
      }
    }),
    [allNodes, selectedId, byId, vpcColorMap],
  )

  const flowEdges: Edge[] = useMemo(() => deriveEdges(allNodes), [allNodes])

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={NODE_TYPES}
      onNodeClick={(_e, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      onNodeContextMenu={(event, rfNode) => {
        event.preventDefault()
        const cloudNode = allNodes.find((n) => n.id === rfNode.id)
        if (cloudNode) onNodeContextMenu(cloudNode, event.clientX, event.clientY)
      }}
      fitView
      style={{ background: 'var(--cb-canvas-bg)' }}
    >
      <Background color="var(--cb-canvas-grid)" gap={20} />
      <MiniMap
        style={{ background: 'var(--cb-minimap-bg)', border: '1px solid var(--cb-minimap-border)' }}
        nodeColor="#FF9900"
      />
    </ReactFlow>
  )
}
