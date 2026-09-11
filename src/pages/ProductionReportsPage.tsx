import { FileText, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const reportTypes = ['Threat Summary', 'Network Security', 'Incident Report', 'Attack Trends', 'System Health'];

export function ProductionReportsPage() {
  const { identity } = useAuth();
  return <main className="mx-auto max-w-6xl space-y-6 p-4 text-[var(--foreground)] md:p-7">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
      <div><p className="text-[10px] uppercase tracking-[.2em] text-blue-600">Security operations</p><h1 className="mt-2 text-2xl font-semibold">Security Reports</h1><p className="mt-1 text-xs text-[var(--muted-foreground)]">Review generated reports from authorized platform data.</p></div>
      <button disabled className="flex items-center gap-2 border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--muted-foreground)] disabled:cursor-not-allowed"><Plus className="size-3.5" />Generate report</button>
    </header>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{reportTypes.map((type) => <div key={type} className="border border-[var(--border)] bg-[var(--card)] p-4"><FileText className="size-4 text-blue-600" /><p className="mt-3 text-xs font-medium">{type}</p><p className="mt-1 text-[10px] text-[var(--muted-foreground)]">No generated report</p></div>)}</section>
    <section className="border border-[var(--border)] bg-[var(--card)] p-8 text-center"><ShieldCheck className="mx-auto size-5 text-emerald-600" /><h2 className="mt-3 text-sm font-semibold">No reports available</h2><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[var(--muted-foreground)]">Reports will appear here after the report service records an authorized run. No synthetic report content is shown.</p><p className="mt-4 text-[10px] text-[var(--muted-foreground)]">Workspace: {identity.organization?.name ?? 'Organization unavailable'}</p></section>
  </main>;
}
