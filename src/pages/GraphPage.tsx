import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Search, Network, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Badge, RiskBadge } from '@/components/fx/Badge';
import { graphService } from '@/services/graphService';
import { DEMO_GRAPH_NODES, DEMO_GRAPH_EDGES } from '@/data/mockData';
import type { GraphNode, GraphEdge } from '@/types';

const NODE_COLORS: Record<GraphNode['type'], string> = {
  ip: '#00A8FF',
  host: '#f59e0b',
  server: '#ef4444',
  domain: '#10b981',
  port: '#1687C8',
};

const riskToColor = (score: number) => {
  const norm = score > 1 ? score / 100 : score;
  if (norm >= 0.8) return '#ef4444';
  if (norm >= 0.6) return '#f59e0b';
  if (norm >= 0.4) return '#F59E0B';
  return '#00A8FF';
};

function layoutGraphNodes(rawNodes: GraphNode[]): Node[] {
  const count = rawNodes.length;
  const radius = Math.max(220, count * 35);
  const cx = 400;
  const cy = 300;

  return rawNodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / count;
    const x = Math.round(cx + radius * Math.cos(angle));
    const y = Math.round(cy + radius * Math.sin(angle));
    const color = riskToColor(n.riskScore);

    return {
      id: n.id,
      position: { x, y },
      data: { label: `${n.label}`, type: n.type, risk: n.riskScore > 1 ? n.riskScore / 100 : n.riskScore },
      style: {
        background: '#0D1319',
        border: `2px solid ${color}`,
        color,
        fontSize: 11,
        fontFamily: 'JetBrains Mono',
        borderRadius: 4,
        padding: '6px 10px',
        width: 140,
      },
    };
  });
}

function layoutGraphEdges(rawEdges: GraphEdge[]): Edge[] {
  return rawEdges.map((e) => {
    const color = riskToColor(e.riskScore);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.relationship,
      style: { stroke: color, strokeWidth: Math.max(1.5, Math.min(4, e.weight)) },
      animated: (e.riskScore > 1 ? e.riskScore : e.riskScore * 100) >= 50,
      labelStyle: { fontSize: 9, fill: '#66727E', fontFamily: 'JetBrains Mono' },
    };
  });
}

const rfNodes: Node[] = [
  { id: 'n1', position: { x: 300, y: 200 }, data: { label: '10.0.1.42', type: 'host', risk: 0.88 }, type: 'default', style: { background: '#0D1319', border: '2px solid #FF3B30', color: '#FF3B30', fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 140 } },
  { id: 'n2', position: { x: 100, y: 60 }, data: { label: 'DC01\n192.168.10.5', type: 'server', risk: 0.72 }, style: { background: '#0D1319', border: '2px solid #F59E0B', color: '#F59E0B', fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 130 } },
  { id: 'n3', position: { x: 500, y: 60 }, data: { label: 'FILE01\n192.168.10.8', type: 'server', risk: 0.65 }, style: { background: '#0D1319', border: '2px solid #F59E0B', color: '#F59E0B', fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 130 } },
  { id: 'n4', position: { x: 300, y: 380 }, data: { label: '10.0.5.100', type: 'host', risk: 0.52 }, style: { background: '#0D1319', border: '2px solid #F59E0B', color: '#F59E0B', fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 130 } },
  { id: 'n5', position: { x: 580, y: 320 }, data: { label: '203.0.113.55\n(External)', type: 'ip', risk: 0.38 }, style: { background: '#0D1319', border: '2px solid #00A8FF', color: '#00A8FF', fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 140 } },
  { id: 'n6', position: { x: 60, y: 280 }, data: { label: 'update.contoso.local', type: 'domain', risk: 0.15 }, style: { background: '#0D1319', border: '1px solid #22C55E', color: '#22C55E', fontSize: 10, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 150 } },
  { id: 'n7', position: { x: 140, y: 380 }, data: { label: 'RDP-SRV\n192.168.10.15', type: 'server', risk: 0.61 }, style: { background: '#0D1319', border: '2px solid #F59E0B', color: '#F59E0B', fontSize: 11, fontFamily: 'JetBrains Mono', borderRadius: 4, padding: '6px 10px', width: 130 } },
];

const rfEdges: Edge[] = [
  { id: 'e1', source: 'n1', target: 'n2', label: 'SMB', style: { stroke: '#ef4444', strokeWidth: 2.5 }, animated: true, labelStyle: { fontSize: 9, fill: '#6b7494', fontFamily: 'JetBrains Mono' } },
  { id: 'e2', source: 'n1', target: 'n3', label: 'SMB', style: { stroke: '#f59e0b', strokeWidth: 2 }, animated: true, labelStyle: { fontSize: 9, fill: '#6b7494', fontFamily: 'JetBrains Mono' } },
  { id: 'e3', source: 'n1', target: 'n7', label: 'RDP', style: { stroke: '#f97316', strokeWidth: 1.5 }, labelStyle: { fontSize: 9, fill: '#6b7494', fontFamily: 'JetBrains Mono' } },
  { id: 'e4', source: 'n4', target: 'n1', label: 'SSH', style: { stroke: '#1687C8', strokeWidth: 1.5 }, labelStyle: { fontSize: 9, fill: '#66727E', fontFamily: 'JetBrains Mono' } },
  { id: 'e5', source: 'n2', target: 'n6', label: 'DNS', style: { stroke: '#10b981', strokeWidth: 1 }, labelStyle: { fontSize: 9, fill: '#6b7494', fontFamily: 'JetBrains Mono' } },
  { id: 'e6', source: 'n4', target: 'n5', label: 'HTTPS', style: { stroke: '#00A8FF', strokeWidth: 1 }, labelStyle: { fontSize: 9, fill: '#66727E', fontFamily: 'JetBrains Mono' } },
];

export function GraphPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);
  const [rawNodes, setRawNodes] = useState<GraphNode[]>(DEMO_GRAPH_NODES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchGraphData() {
      try {
        const data = await graphService.getGraph();
        if (!active) return;
        if (data && data.nodes && data.nodes.length > 0) {
          setRawNodes(data.nodes);
          setNodes(layoutGraphNodes(data.nodes));
          setEdges(layoutGraphEdges(data.edges || []));
        }
      } catch (err) {
        console.warn('Using demo graph topology:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchGraphData();
    return () => { active = false; };
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    const found = rawNodes.find(n => n.id === node.id) || DEMO_GRAPH_NODES.find(n => n.id === node.id);
    setSelectedNode(found ?? null);
  }, [rawNodes]);

  return (
    <div className="flex h-full min-h-[calc(100vh-96px)]">
      {/* Graph */}
      <div className="flex-1 relative">
        {/* Search overlay */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="pl-6 pr-3 h-7 text-xs bg-[var(--card)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-blue-500 shadow-lg"
            />
          </div>
          <div className="flex gap-1">
            {(['host', 'server', 'domain', 'ip'] as const).map(type => (
              <div key={type} className="flex items-center gap-1 px-2 py-1 bg-[var(--card)] border border-[var(--border)] rounded text-[10px] font-mono text-[var(--muted-foreground)]">
                <span className="size-1.5 rounded-full" style={{ background: NODE_COLORS[type] }} />
                {type}
              </div>
            ))}
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          style={{ background: 'var(--card)' }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={20} size={1} />
          <Controls style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }} />
          <MiniMap style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }} nodeColor={n => riskToColor(0.5)} />
        </ReactFlow>
      </div>

      {/* Node detail drawer */}
      {selectedNode && (
        <div className="w-72 border-l border-[var(--border)] bg-[var(--card)] p-4 overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)] font-mono">{selectedNode.label}</p>
              <Badge variant="default" className="mt-1">{selectedNode.type.toUpperCase()}</Badge>
            </div>
            <button onClick={() => setSelectedNode(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="size-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Risk Assessment</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[var(--border)] rounded-full">
                  <div className="h-full rounded-full" style={{ width: `${selectedNode.riskScore > 1 ? selectedNode.riskScore : selectedNode.riskScore * 100}%`, background: riskToColor(selectedNode.riskScore) }} />
                </div>
                <RiskBadge score={selectedNode.riskScore} />
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Statistics</p>
              <div className="space-y-1.5 text-xs">
                {[
                  { k: 'Connections', v: selectedNode.connections },
                  { k: 'Traffic', v: `${selectedNode.trafficMbps} Mbps` },
                  { k: 'Last Seen', v: new Date(selectedNode.lastSeen).toLocaleTimeString() },
                ].map(r => (
                  <div key={r.k} className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">{r.k}</span>
                    <span className="font-mono text-[var(--foreground)]">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Properties</p>
              <div className="space-y-1.5 text-xs">
                {Object.entries(selectedNode.properties).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-[var(--muted-foreground)] shrink-0">{k}</span>
                    <span className="font-mono text-[var(--foreground)] text-right">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
