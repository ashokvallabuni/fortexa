import { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { Check, TrendingUp, GitBranch, HelpCircle, FileText, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Badge, LabelBadge, RiskBadge } from '@/components/fx/Badge';
import { Button } from '@/components/fx/Button';
import { RiskGauge } from '@/components/fx/RiskGauge';
import { alertService } from '@/services/alertService';
import type { Alert, AlertSeverity } from '@/types';

const SEVERITY_LEFT_BORDER: Record<AlertSeverity, string> = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-orange-400',
  low: 'border-l-blue-400',
};

const SEV_BG: Record<AlertSeverity, string> = {
  critical: 'bg-red-500/5',
  high: 'bg-amber-500/5',
  medium: 'bg-orange-500/5',
  low: 'bg-blue-500/5',
};

export function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical' | 'high'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadAlerts() {
      try {
        const liveAlerts = await alertService.getAlerts(50);
        if (!active) return;
        setAlerts(liveAlerts);
      } catch {
        if (active) setError('Unable to load security alerts.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadAlerts();
    return () => { active = false; };
  }, []);

  const ack = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, isAcknowledged: true } : a));

  const filtered = alerts.filter(a => {
    if (filter === 'unacknowledged') return !a.isAcknowledged;
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'high') return a.severity === 'high';
    return true;
  });

  const counts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    unack: alerts.filter(a => !a.isAcknowledged).length,
  };

  return (
    <div className="p-4 md:p-5 space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold">Early Warning Center</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Forecast-driven alerts — elevated risk predictions, not confirmed attacks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-mono text-red-400">{counts.unack} unacknowledged</span>
        </div>
      </div>

      {error && <div className="flex items-center justify-between border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"><span>{error}</span><button onClick={() => window.location.reload()} className="font-medium underline">Retry</button></div>}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: 'Critical', count: counts.critical, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', sev: 'critical' },
          { label: 'High', count: counts.high, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', sev: 'high' },
          { label: 'Unacknowledged', count: counts.unack, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', sev: null },
          { label: 'Total', count: alerts.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', sev: null },
        ] as const).map(s => (
          <div key={s.label} className={`border rounded p-3 ${s.bg}`}>
            <p className={`text-2xl font-mono font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="size-3.5 text-[var(--muted-foreground)]" />
        {(['all', 'unacknowledged', 'critical', 'high'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded border capitalize transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent text-[var(--muted-foreground)] border-[var(--border)] hover:border-blue-500/50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading && <div className="border border-[var(--border)] bg-[var(--card)] p-8 text-center text-xs text-[var(--muted-foreground)]">Loading threat intelligence...</div>}

      {/* Alerts list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-3">
          {filtered.map(alert => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`border-l-4 border border-[var(--border)] rounded p-4 ${SEVERITY_LEFT_BORDER[alert.severity]} ${SEV_BG[alert.severity]} ${alert.isResolved ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-wrap items-start gap-4">
                {/* Main content */}
                <div className="flex-1 min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={alert.severity}>{alert.severity.toUpperCase()}</Badge>
                    <LabelBadge label={alert.label} />
                    {alert.isAcknowledged && <Badge variant="safe">ACK</Badge>}
                    {alert.isResolved && <Badge variant="safe">RESOLVED</Badge>}
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)] ml-auto">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
                    {alert.predictedBehavior}
                  </p>

                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                    {alert.reason}
                  </p>

                  {/* Metrics row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--muted-foreground)]">Risk</span>
                      <RiskBadge score={alert.riskScore} />
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Confidence</span>
                      <span className="font-mono text-[var(--primary-blue)] ml-1.5">{Math.round(alert.confidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted-foreground)]">Horizon</span>
                      <span className="font-mono text-[var(--foreground)] ml-1.5">{alert.forecastHorizon} windows ({alert.forecastHorizon * 5} min)</span>
                    </div>
                  </div>

                  {/* Entities */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-[var(--muted-foreground)]">Entities:</span>
                    {alert.affectedEntities.map(e => (
                      <Badge key={e} variant="default">{e}</Badge>
                    ))}
                  </div>
                </div>

                {/* Gauge + Actions */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <RiskGauge score={alert.riskScore} size="sm" />
                  <div className="flex flex-col gap-1.5 w-full">
                    {!alert.isAcknowledged && (
                      <Button variant="secondary" size="sm" onClick={() => ack(alert.id)} className="w-full justify-center">
                        <Check className="size-3" /> Acknowledge
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate('/forecast')} className="w-full justify-center">
                      <TrendingUp className="size-3" /> Forecast
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/graph')} className="w-full justify-center">
                      <GitBranch className="size-3" /> Graph
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/explainability')} className="w-full justify-center">
                      <HelpCircle className="size-3" /> Explain
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="w-full justify-center">
                      <FileText className="size-3" /> Report
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3 text-center">
          <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Check className="size-5 text-emerald-400" />
          </div>
          <p className="text-sm font-medium">No active alerts.</p>
          <p className="text-xs text-[var(--muted-foreground)]">Ingest network telemetry to populate forecast-driven security events.</p>
        </div>
      )}
    </div>
  );
}
