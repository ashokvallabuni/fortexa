import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Activity, AlertTriangle, ArrowUpRight, Check, Database, FileClock,
  Gauge, HardDrive, Layers3, LockKeyhole, Network, Plus, RefreshCw, Server, Shield,
  SlidersHorizontal, Users, X,
} from 'lucide-react';

type Section = 'overview' | 'users' | 'organizations' | 'assets' | 'datasets' | 'models' | 'forecasts' | 'alerts' | 'audit' | 'health' | 'settings';
type AdminData = {
  metrics: { organizations: number; activeUsers: number; networkAssets: number; activeAlerts: number; highRiskForecasts: number; ingestion: string };
  profiles: Array<{ id: string; email: string | null; display_name: string | null; role: string; created_at: string }>;
  datasets: Array<Record<string, unknown>>;
  uploads: Array<Record<string, unknown>>;
  models: Array<Record<string, unknown>>;
  alerts: Array<{ id: string; title: string; severity: string; status: string; detected_at: string; entity_key: string | null }>;
  audit: Array<{ id: number; action: string; resource_type: string | null; created_at: string; detail: unknown; actor_email?: string | null; ip_address?: string | null; success?: boolean; before_values?: unknown; after_values?: unknown }>;
  services: { backend: boolean; database: boolean; storage: boolean; inference: boolean };
};

const sections: Array<{ id: Section; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity }, { id: 'users', label: 'Users', icon: Users },
  { id: 'organizations', label: 'Organizations', icon: Layers3 }, { id: 'assets', label: 'Network Assets', icon: Network },
  { id: 'datasets', label: 'Datasets', icon: Database }, { id: 'models', label: 'Model Management', icon: Gauge },
  { id: 'forecasts', label: 'Forecast Runs', icon: ArrowUpRight }, { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'audit', label: 'Audit Logs', icon: FileClock }, { id: 'health', label: 'System Health', icon: Server },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

function formatDate(value: unknown) {
  if (!value || typeof value !== 'string') return '—';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function Status({ value }: { value: boolean | string }) {
  const healthy = value === true || value === 'Healthy' || value === 'COMPLETED' || value === 'production';
  return <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${healthy ? 'text-emerald-300' : 'text-amber-300'}`}><span className={`size-1.5 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-amber-400'}`} />{typeof value === 'string' ? value : healthy ? 'Operational' : 'Unavailable'}</span>;
}

function Metric({ label, value, detail, icon: Icon, tone = 'cyan' }: { label: string; value: string | number; detail: string; icon: typeof Activity; tone?: 'cyan' | 'amber' | 'red' | 'green' }) {
  const colors = { cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20', amber: 'text-amber-300 bg-amber-400/10 border-amber-400/20', red: 'text-red-300 bg-red-400/10 border-red-400/20', green: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' };
  return <div className="border border-slate-700/70 bg-[#0d1b2a] p-4"><div className="flex items-start justify-between"><div><p className="text-[10px] uppercase tracking-[.16em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p></div><span className={`flex size-8 items-center justify-center border ${colors[tone]}`}><Icon className="size-4" /></span></div><p className="mt-3 text-[11px] text-slate-500">{detail}</p></div>;
}

function Table({ children }: { children: React.ReactNode }) { return <div className="overflow-x-auto border border-slate-700/70"><table className="w-full min-w-[700px] text-left text-xs">{children}</table></div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="border-b border-slate-700/70 bg-[#0d1b2a] px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">{children}</th>; }
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <td className={`border-b border-slate-800 px-4 py-3 text-slate-300 ${className}`}>{children}</td>; }

export function AdminConsolePage() {
  const { session } = useAuth();
  const [section, setSection] = useState<Section>(() => (window.location.hash.slice(1) as Section) || 'overview');
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');

  const load = async () => {
    if (!session?.access_token) return;
    setLoading(true); setError(null);
    const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${session.access_token}` } });
    const payload = (await response.json()) as { success: boolean; message?: string; data?: AdminData };
    if (!response.ok || !payload.success || !payload.data) setError(payload.message ?? 'Unable to load administrator data.');
    else setData(payload.data);
    setLoading(false);
  };
  useEffect(() => { void load(); }, [session?.access_token]);
  useEffect(() => { const onHash = () => setSection((window.location.hash.slice(1) as Section) || 'overview'); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);

  const act = async (action: string, body: Record<string, string>) => {
    if (!session?.access_token) return;
    setBusy(body.id ?? action);
    const response = await fetch('/api/admin', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) });
    if (!response.ok) { const result = (await response.json()) as { message?: string }; setError(result.message ?? 'Action failed.'); }
    setBusy(null); void load();
  };

  const productionModel = useMemo(() => data?.models.find((model) => model.stage === 'production'), [data?.models]);
  const title = sections.find((item) => item.id === section)?.label ?? 'Overview';
  if (loading && !data) return <div className="min-h-full bg-[#07121f] p-6 text-slate-300"><div className="animate-pulse text-xs uppercase tracking-[.2em] text-cyan-400">Loading secure admin workspace...</div></div>;

  return <div className="min-h-full bg-[#07121f] text-slate-100">
    <div className="flex min-h-full flex-col xl:flex-row">
      <aside className="w-full shrink-0 border-b border-slate-800 bg-[#091827] xl:w-60 xl:border-b-0 xl:border-r">
        <div className="border-b border-slate-800 px-5 py-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center bg-cyan-400 text-[#06111d]"><Shield className="size-5" /></div><div><p className="text-sm font-bold tracking-[.22em]">FORTEXA</p><p className="mt-1 text-[9px] uppercase tracking-widest text-cyan-400">Admin console</p></div></div></div>
        <nav className="flex gap-1 overflow-x-auto p-3 xl:block">{sections.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setSection(id); window.location.hash = id; }} className={`flex w-max items-center gap-3 border-l-2 px-3 py-2 text-xs transition-colors xl:w-full ${section === id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-200' : 'border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}><Icon className="size-3.5" />{label}</button>)}</nav>
        <div className="hidden border-t border-slate-800 p-4 text-[10px] text-slate-500 xl:block"><div className="flex items-center gap-2"><LockKeyhole className="size-3" />RBAC enforced by Supabase</div><p className="mt-2 font-mono text-slate-600">FORTEXA ADMIN / v2.1.4</p></div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-[10px] uppercase tracking-[.22em] text-cyan-400">Control plane / {section}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-xs text-slate-500">Platform governance, model operations and security telemetry.</p></div><button onClick={() => void load()} className="flex items-center gap-2 border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500 hover:text-cyan-300"><RefreshCw className="size-3.5" />Refresh data</button></header>
        {error && <div className="mb-5 flex items-center justify-between border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs text-red-200"><span>{error}</span><button onClick={() => setError(null)}><X className="size-4" /></button></div>}
        {section === 'overview' && data && <Overview data={data} productionModel={productionModel} />}
        {section === 'users' && data && <UsersSection data={data} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} busy={busy} act={act} />}
        {section === 'organizations' && <EmptySection title="Organizations" description="FORTEXA organization membership and permission grants are enforced in PostgreSQL. Directory management is available through the secured admin API." />}
        {section === 'assets' && <EmptySection title="Network Assets" description="Asset inventory is populated by the network entity pipeline. Open a dataset to inspect the live graph." />}
        {section === 'datasets' && data && <DatasetsSection data={data} />}
        {section === 'models' && data && <ModelsSection data={data} busy={busy} act={act} />}
        {section === 'forecasts' && <EmptySection title="Forecast Runs" description="Forecast run history will appear here when the inference worker registers run metadata." />}
        {section === 'alerts' && data && <AlertsSection data={data} busy={busy} act={act} />}
        {section === 'audit' && data && <AuditSection data={data} />}
        {section === 'health' && data && <HealthSection data={data} />}
        {section === 'settings' && <EmptySection title="Platform Settings" description="Configuration is intentionally read-only here until an explicit setting contract is enabled." />}
      </main>
    </div>
  </div>;
}

function Overview({ data, productionModel }: { data: AdminData; productionModel?: Record<string, unknown> }) {
  return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Metric label="Organizations" value={data.metrics.organizations} detail="Unique dataset owners" icon={Layers3} /><Metric label="Active users" value={data.metrics.activeUsers} detail="Profiles in Supabase" icon={Users} tone="green" /><Metric label="Network assets" value={data.metrics.networkAssets} detail="Entities in ingested data" icon={Network} /><Metric label="Data ingestion" value={data.metrics.ingestion} detail={`${data.uploads.length} recent uploads`} icon={Database} tone={data.metrics.ingestion === 'Healthy' ? 'green' : 'amber'} /><Metric label="Active alerts" value={data.metrics.activeAlerts} detail="Unresolved security events" icon={AlertTriangle} tone="red" /><Metric label="High-risk forecasts" value={data.metrics.highRiskForecasts} detail="High and critical alerts" icon={ArrowUpRight} tone="amber" /></div><div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]"><div className="border border-slate-700/70 bg-[#0d1b2a] p-5"><div className="mb-5 flex items-center justify-between"><div><p className="text-sm font-medium">Platform activity</p><p className="mt-1 text-xs text-slate-500">Latest events recorded by the control plane</p></div><Activity className="size-4 text-cyan-400" /></div>{data.audit.slice(0, 6).map((item) => <div key={item.id} className="flex items-center justify-between border-t border-slate-800 py-3"><div className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-cyan-400" /><div><p className="text-xs text-slate-300">{item.action}</p><p className="text-[10px] text-slate-600">{item.resource_type ?? 'system'}</p></div></div><span className="text-[10px] font-mono text-slate-500">{formatDate(item.created_at)}</span></div>)}{data.audit.length === 0 && <p className="py-8 text-center text-xs text-slate-500">No activity has been recorded yet.</p>}</div><div className="border border-slate-700/70 bg-[#0d1b2a] p-5"><p className="text-sm font-medium">Runtime posture</p><div className="mt-5 space-y-4"><div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-xs text-slate-400">Backend API</span><Status value={data.services.backend} /></div><div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-xs text-slate-400">Database</span><Status value={data.services.database} /></div><div className="flex justify-between border-b border-slate-800 pb-3"><span className="text-xs text-slate-400">Object storage</span><Status value={data.services.storage} /></div><div className="flex justify-between"><span className="text-xs text-slate-400">ML inference</span><Status value={data.services.inference} /></div></div><div className="mt-6 border border-cyan-400/20 bg-cyan-400/5 p-3"><p className="text-[10px] uppercase tracking-widest text-cyan-300">Production model</p><p className="mt-2 text-sm text-slate-200">{productionModel ? `${String(productionModel.name)} ${String(productionModel.version)}` : 'No production model registered'}</p></div></div></div></div>;
}

function UsersSection({ data, inviteEmail, setInviteEmail, busy, act }: { data: AdminData; inviteEmail: string; setInviteEmail: (value: string) => void; busy: string | null; act: (action: string, body: Record<string, string>) => Promise<void> }) {
  return <div className="space-y-4"><div className="flex flex-wrap gap-2"><input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="user@organization.com" className="h-9 w-64 border border-slate-700 bg-[#0d1b2a] px-3 text-xs text-slate-200 outline-none focus:border-cyan-500" /><button disabled={!inviteEmail || busy === 'user.invite'} onClick={() => { void act('user.invite', { email: inviteEmail }); setInviteEmail(''); }} className="flex items-center gap-2 bg-cyan-400 px-3 text-xs font-semibold text-[#06111d] disabled:opacity-40"><Plus className="size-3.5" />Invite user</button></div><Table><thead><tr><Th>User</Th><Th>Role</Th><Th>Created</Th><Th>Access</Th></tr></thead><tbody>{data.profiles.map((profile) => <tr key={profile.id}><Td><p className="text-slate-200">{profile.display_name ?? 'Unnamed user'}</p><p className="mt-1 text-[10px] text-slate-500">{profile.email ?? 'No email'}</p></Td><Td><select value={profile.role} onChange={(event) => void act('user.role', { id: profile.id, role: event.target.value })} className="border border-slate-700 bg-[#07121f] px-2 py-1 text-xs text-slate-300"><option value="admin">Admin</option><option value="SUPER_ADMIN">Super Admin</option><option value="analyst">SOC Analyst</option><option value="researcher">Researcher</option><option value="viewer">Security Manager</option></select></Td><Td className="font-mono text-[10px]">{formatDate(profile.created_at)}</Td><Td><Status value /></Td></tr>)}</tbody></Table></div>;
}

function DatasetsSection({ data }: { data: AdminData }) { return <Table><thead><tr><Th>Dataset</Th><Th>Type</Th><Th>Records</Th><Th>Processing</Th><Th>Uploaded</Th></tr></thead><tbody>{data.datasets.map((item) => <tr key={String(item.id)}><Td><p className="text-slate-200">{String(item.name)}</p><p className="mt-1 font-mono text-[10px] text-slate-600">{String(item.id).slice(0, 12)}</p></Td><Td className="uppercase">{String(item.source_format)}</Td><Td className="font-mono">{Number(item.flow_count ?? 0).toLocaleString()}</Td><Td><Status value={String(item.processing_status ?? 'not_started')} /></Td><Td className="font-mono text-[10px]">{formatDate(item.created_at)}</Td></tr>)}</tbody></Table>; }
function ModelsSection({ data, busy, act }: { data: AdminData; busy: string | null; act: (action: string, body: Record<string, string>) => Promise<void> }) { return <Table><thead><tr><Th>Version</Th><Th>Components</Th><Th>Horizon K</Th><Th>Metrics</Th><Th>Stage</Th><Th /></tr></thead><tbody>{data.models.map((item) => { const metrics = (item.metrics ?? {}) as Record<string, unknown>; return <tr key={String(item.id)}><Td><p className="text-slate-200">{String(item.name)}</p><p className="text-[10px] text-slate-500">{String(item.version)} · {formatDate(item.created_at)}</p></Td><Td><div className="flex gap-1"><Status value /> <Status value /></div></Td><Td className="font-mono">{String(metrics.horizon_k ?? metrics.forecast_horizon ?? '—')}</Td><Td className="font-mono text-[10px]">F1 {String(metrics.f1 ?? '—')} · P {String(metrics.precision ?? '—')}</Td><Td><Status value={String(item.stage ?? 'registered')} /></Td><Td><button disabled={busy === String(item.id)} onClick={() => void act('model.activate', { id: String(item.id) })} className="border border-slate-700 px-2 py-1 text-[10px] text-cyan-300 hover:border-cyan-500">Activate</button></Td></tr>; })}</tbody></Table>; }
function AlertsSection({ data, busy, act }: { data: AdminData; busy: string | null; act: (action: string, body: Record<string, string>) => Promise<void> }) { return <Table><thead><tr><Th>Alert</Th><Th>Severity</Th><Th>Asset</Th><Th>Detected</Th><Th>Status</Th><Th /></tr></thead><tbody>{data.alerts.map((item) => <tr key={item.id}><Td className="text-slate-200">{item.title}</Td><Td><span className={`text-[10px] uppercase ${item.severity === 'critical' || item.severity === 'high' ? 'text-red-300' : 'text-amber-300'}`}>{item.severity}</span></Td><Td className="font-mono text-[10px]">{item.entity_key ?? '—'}</Td><Td className="font-mono text-[10px]">{formatDate(item.detected_at)}</Td><Td><Status value={item.status} /></Td><Td>{item.status !== 'resolved' && <button disabled={busy === item.id} onClick={() => void act('alert.status', { id: item.id, status: 'acknowledged' })} className="border border-slate-700 px-2 py-1 text-[10px] text-slate-300">Acknowledge</button>}</Td></tr>)}</tbody></Table>; }
function AuditSection({ data }: { data: AdminData }) { return <Table><thead><tr><Th>Action</Th><Th>Actor</Th><Th>Resource</Th><Th>Outcome</Th><Th>Request</Th><Th>Time</Th></tr></thead><tbody>{data.audit.map((item) => <tr key={item.id}><Td className="font-mono text-cyan-300">{item.action}</Td><Td><p>{item.actor_email ?? 'system'}</p><p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-slate-600">{JSON.stringify(item.after_values ?? item.detail)}</p></Td><Td>{item.resource_type ?? 'system'}</Td><Td><Status value={item.success !== false} /></Td><Td className="font-mono text-[10px] text-slate-500">{item.ip_address ?? '—'}</Td><Td className="font-mono text-[10px]">{formatDate(item.created_at)}</Td></tr>)}</tbody></Table>; }
function HealthSection({ data }: { data: AdminData }) { const services = [['Backend status', data.services.backend, Server], ['ML inference service', data.services.inference, Gauge], ['Database', data.services.database, Database], ['Storage', data.services.storage, HardDrive], ['Data ingestion', data.metrics.ingestion === 'Healthy', Activity]] as const; return <div className="grid gap-3 md:grid-cols-2">{services.map(([label, value, Icon]) => <div key={label} className="flex items-center justify-between border border-slate-700/70 bg-[#0d1b2a] p-5"><div className="flex items-center gap-3"><Icon className="size-4 text-cyan-400" /><span className="text-sm text-slate-300">{label}</span></div><Status value={value} /></div>)}<div className="border border-slate-700/70 bg-[#0d1b2a] p-5"><p className="text-[10px] uppercase tracking-widest text-slate-500">Latency</p><p className="mt-3 font-mono text-2xl text-slate-200">—</p><p className="mt-1 text-xs text-slate-500">Awaiting telemetry from service health probes</p></div></div>; }
function EmptySection({ title, description }: { title: string; description: string }) { return <div className="border border-dashed border-slate-700 bg-[#0d1b2a] p-10 text-center"><Check className="mx-auto size-5 text-cyan-400" /><h2 className="mt-4 text-sm font-medium">{title}</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">{description}</p></div>; }