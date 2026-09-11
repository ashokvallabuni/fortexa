import { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Badge, RiskBadge } from '@/components/fx/Badge';
import { KPICard } from '@/components/fx/KPICard';
import { networkService } from '@/services/networkService';
import { formatBytes } from '@/data/mockData';
import type { NetworkState, NetworkFlow } from '@/types';

const PROTOCOL_COLORS = ['#00A8FF', '#1687C8', '#22C55E', '#F59E0B', '#FF3B30'];

export function NetworkPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [states, setStates] = useState<NetworkState[]>([]);
  const [flows, setFlows] = useState<NetworkFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 6;

  useEffect(() => {
    let active = true;
    async function loadNetworkData() {
      try {
        const [fetchedStates, fetchedFlows] = await Promise.all([
          networkService.getNetworkStates(40),
          networkService.getFlows(0, 100).then(r => r.flows),
        ]);
        if (!active) return;
        setStates(fetchedStates);
        setFlows(fetchedFlows);
      } catch {
        if (active) setError('Unable to load network telemetry.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadNetworkData();
    return () => { active = false; };
  }, []);

  const current = states[states.length - 1];
  if (loading) return <div className="p-8 text-xs text-[var(--muted-foreground)]">Loading network telemetry...</div>;
  if (error) return <div className="mx-auto max-w-xl p-8"><div className="border border-red-200 bg-red-50 p-6 text-sm text-red-800"><p>{error}</p><button onClick={() => window.location.reload()} className="mt-4 font-medium underline">Retry</button></div></div>;
  if (!current) return <div className="mx-auto max-w-xl p-8"><div className="border border-[var(--border)] bg-[var(--card)] p-8 text-center"><h1 className="text-base font-semibold">No network telemetry available yet.</h1><p className="mt-2 text-xs text-[var(--muted-foreground)]">Upload an authorized PCAP, NetFlow/IPFIX, or CSV dataset to begin processing.</p></div></div>;
  const protocols = Object.entries(current.protocols).map(([name, value]) => ({ name, value }));

  const trafficData = states.map(s => ({
    t: `W${s.windowId}`,
    mbps: s.trafficVolumeMbps,
    packets: s.totalPackets / 1000,
  }));

  const filtered = flows.filter(f =>
    !search || f.srcIp.includes(search) || f.dstIp.includes(search) || f.protocol.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-base font-semibold text-[var(--foreground)]">Network Intelligence</h1>
        <p className="text-xs text-[var(--muted-foreground)]">Real-time network statistics and flow analysis</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Active Hosts" value={current.activeHosts} accent="default" />
        <KPICard title="Connections" value={current.activeConnections.toLocaleString()} accent="default" />
        <KPICard title="Packets" value={`${(current.totalPackets / 1000).toFixed(0)}K`} accent="default" />
        <KPICard title="Traffic" value={`${current.trafficVolumeMbps} Mbps`} accent="high" />
        <KPICard title="Unique Ports" value={current.uniquePorts} accent="default" />
        <KPICard title="Avg Flow" value={`${current.avgFlowDuration.toFixed(1)}s`} accent="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic timeline */}
        <Card className="lg:col-span-2" padding="none">
          <CardHeader className="px-4 pt-4 pb-0">
            <CardTitle>Traffic Volume Timeline</CardTitle>
          </CardHeader>
          <div className="h-40 px-2 pb-3 mt-3">
            <ResponsiveContainer>
              <AreaChart data={trafficData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00A8FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00A8FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }} />
                <Area type="monotone" dataKey="mbps" name="Mbps" stroke="#00A8FF" fill="url(#trafficGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Protocol distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Protocol Distribution</CardTitle>
          </CardHeader>
          <div className="flex flex-col items-center gap-3">
            <PieChart width={120} height={120}>
              <Pie data={protocols} dataKey="value" cx={60} cy={60} outerRadius={50} innerRadius={28} strokeWidth={0}>
                {protocols.map((_, i) => (
                  <Cell key={i} fill={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="space-y-1 w-full">
              {protocols.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: PROTOCOL_COLORS[i] }} />
                    <span className="text-[var(--muted-foreground)]">{p.name}</span>
                  </div>
                  <span className="font-mono text-[var(--foreground)]">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Flow table */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Table</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search IP, protocol..."
                className="pl-6 pr-3 h-7 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Timestamp', 'Source', 'Destination', 'Protocol', 'Src Port', 'Dst Port', 'Packets', 'Bytes', 'Duration', 'Risk'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[var(--muted-foreground)] font-medium uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(flow => (
                <tr key={flow.id} className="border-b border-[var(--border)] hover:bg-[var(--secondary)] transition-colors">
                  <td className="py-2 px-3 font-mono text-[var(--muted-foreground)] whitespace-nowrap">{new Date(flow.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2 px-3 font-mono">{flow.srcIp}</td>
                  <td className="py-2 px-3 font-mono">{flow.dstIp}</td>
                  <td className="py-2 px-3 font-mono">
                    <Badge variant="default">{flow.protocol}</Badge>
                  </td>
                  <td className="py-2 px-3 font-mono text-[var(--muted-foreground)]">{flow.srcPort}</td>
                  <td className="py-2 px-3 font-mono text-[var(--muted-foreground)]">{flow.dstPort}</td>
                  <td className="py-2 px-3 font-mono">{flow.packets.toLocaleString()}</td>
                  <td className="py-2 px-3 font-mono">{formatBytes(flow.bytes)}</td>
                  <td className="py-2 px-3 font-mono text-[var(--muted-foreground)]">{flow.duration.toFixed(1)}s</td>
                  <td className="py-2 px-3">
                    <RiskBadge score={flow.riskScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--muted-foreground)]">Showing {paged.length} of {filtered.length} flows</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-1 text-xs rounded border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--secondary)]">←</button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-2 py-1 text-xs rounded border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--secondary)]">→</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
