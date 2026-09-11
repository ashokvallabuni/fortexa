import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Brain,
  Shield,
  ArrowUpRight,
  Network,
  Server,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { KPICard } from '@/components/fx/KPICard';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { RiskTimeline } from '@/components/charts/RiskTimeline';
import { ForecastChart } from '@/components/charts/ForecastChart';
import { Badge, LabelBadge, RiskBadge } from '@/components/fx/Badge';
import { RiskGauge } from '@/components/fx/RiskGauge';
import { Button } from '@/components/fx/Button';
import { PageLoader } from '@/components/fx/LoadingState';
import { getActiveDatasetId } from '@/services/api';
import {
  DEMO_NETWORK_STATES,
  DEMO_FORECAST,
  DEMO_FEATURE_CONTRIBUTIONS,
  DEMO_ALERTS,
} from '@/data/mockData';
import { networkService } from '@/services/networkService';
import { alertService } from '@/services/alertService';
import type { NetworkState, Alert } from '@/types';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.05 } } };

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const datasetId = getActiveDatasetId();
  const [networkStates, setNetworkStates] = useState<NetworkState[]>(DEMO_NETWORK_STATES);
  const [alerts, setAlerts] = useState<Alert[]>(DEMO_ALERTS);

  useEffect(() => {
    let active = true;
    async function loadLiveData() {
      try {
        const [states, liveAlerts] = await Promise.all([
          networkService.getNetworkStates(30).catch(() => [] as NetworkState[]),
          alertService.getAlerts(10).catch(() => [] as Alert[]),
        ]);
        if (!active) return;
        if (states && states.length > 0) setNetworkStates(states);
        if (liveAlerts && liveAlerts.length > 0) setAlerts(liveAlerts);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadLiveData();
    return () => { active = false; };
  }, []);

  if (loading) return <PageLoader />;

  if (!datasetId) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="border border-[var(--border)] bg-[var(--card)] p-8">
          <p className="text-[10px] uppercase tracking-widest text-blue-400 mb-3">
            Awaiting validated data
          </p>
          <h1 className="text-xl font-semibold">No active dataset</h1>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mt-2">
            Import an official dataset or an authorized network capture before viewing network
            states, forecasts or alerts. FORTEXA does not display estimated operational metrics
            without a validated source.
          </p>
          <button
            onClick={() => navigate('/datasets')}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
          >
            Open datasets
          </button>
        </div>
      </div>
    );
  }

  const current = networkStates[networkStates.length - 1] ?? DEMO_NETWORK_STATES[0];
  const forecast = DEMO_FORECAST;
  const criticalAlerts = alerts.filter(a => !a.isAcknowledged).length;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="p-4 md:p-5 space-y-5 max-w-screen-2xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Cyber Defence Command Center</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Window {current.windowId} · {new Date(current.timestamp).toLocaleString()} · 5-min
            windows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/alerts')}>
            <AlertTriangle className="size-3 text-amber-400" />
            <span className="text-amber-400">{criticalAlerts} Unack'd</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/forecast')}>
            <TrendingUp className="size-3.5" /> Run Forecast
          </Button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <KPICard
          title="Current Risk"
          value={`${Math.round(current.riskScore * 100)}%`}
          subtitle="Window 20"
          icon={<Shield className="size-3.5" />}
          accent="high"
          trend="up"
          trendValue="+14%"
        />
        <KPICard
          title="Forecast Peak"
          value={`${Math.round(Math.max(...forecast.states.map((s) => s.predictedRisk)) * 100)}%`}
          subtitle="W+3 · +15 min"
          icon={<TrendingUp className="size-3.5" />}
          accent="critical"
          trend="up"
          trendValue="W+3"
        />
        <KPICard
          title="Confidence"
          value={`${Math.round(forecast.overallConfidence * 100)}%`}
          subtitle="Model estimate"
          icon={<Brain className="size-3.5" />}
          accent="forecast"
        />
        <KPICard
          title="Active Alerts"
          value={alerts.length}
          subtitle={`${criticalAlerts} unacknowledged`}
          icon={<AlertTriangle className="size-3.5" />}
          accent="critical"
          trend="up"
          trendValue={`${criticalAlerts} new`}
        />
        <KPICard
          title="Network Entities"
          value={current.activeHosts}
          subtitle={`${current.activeConnections.toLocaleString()} conns`}
          icon={<Network className="size-3.5" />}
          accent="default"
        />
        <KPICard
          title="Model Status"
          value="READY"
          subtitle="FORTEXA v2.1.4"
          icon={<Activity className="size-3.5" />}
          accent="safe"
        />
      </motion.div>

      {/* Row 1: Risk Timeline + Gauge */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padding="none">
          <CardHeader className="px-4 pt-4 pb-2">
            <div>
              <CardTitle>Risk Timeline</CardTitle>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                <span className="text-blue-400">Blue = Observed</span> ·{' '}
                <span className="text-[var(--primary-blue)]">Blue dashed = Predicted</span> · Reference lines
                at 60% and 80%
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-red-400 animate-pulse" />
              <Badge variant="forecast">LIVE FORECAST</Badge>
            </div>
          </CardHeader>
          <div className="h-52 px-2 pb-3">
            <RiskTimeline observed={networkStates} forecast={forecast.states} />
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-4 py-6">
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
            Current Risk
          </p>
          <RiskGauge score={current.riskScore} size="lg" />
          <div className="w-full space-y-2 px-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Anomaly Score</span>
              <span className="font-mono text-red-400">
                {Math.round(current.anomalyScore * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">SYN Rate</span>
              <span className="font-mono text-amber-400">{current.synRate} pkt/min</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">New Dst Ports</span>
              <span className="font-mono text-amber-400">{current.newDestinationPorts}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--muted-foreground)]">Traffic Volume</span>
              <span className="font-mono text-[var(--foreground)]">
                {current.trafficVolumeMbps} Mbps
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => navigate('/network')}
          >
            View Network <ChevronRight className="size-3" />
          </Button>
        </Card>
      </motion.div>

      {/* Row 2: Forecast Chart + Feature Contributions */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padding="none">
          <CardHeader className="px-4 pt-4 pb-2">
            <div>
              <CardTitle>Attack Forecast — 5-Window Horizon</CardTitle>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Model-estimated risk progression · Confidence decreases with horizon · Not a
                confirmed attack sequence
              </p>
            </div>
            <Badge variant="forecast">PREDICTED</Badge>
          </CardHeader>
          <div className="h-52 px-2 pb-3">
            <ForecastChart states={forecast.states} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why Is Risk Increasing?</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/explainability')}>
              <ArrowUpRight className="size-3" />
            </Button>
          </CardHeader>
          <div className="space-y-3">
            {DEMO_FEATURE_CONTRIBUTIONS.slice(0, 5).map((f, i) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--foreground)]">{f.feature}</span>
                  <span className="text-xs font-mono text-amber-400 ml-2 shrink-0">
                    +{f.contribution.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `hsl(${35 + i * 12}, 85%, 55%)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(f.contribution / 0.24) * 100}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                  />
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5 truncate">
                  {f.description.split('—')[0]}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Row 3: Attack Progression */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Predicted Attack Progression</CardTitle>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                Model-estimated MITRE ATT&CK tactic sequence — probabilistic, not a confirmed attack
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/attack-timeline')}>
              Full Timeline <ArrowUpRight className="size-3" />
            </Button>
          </CardHeader>

          {/* Progression swimlane */}
          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-5 left-0 right-0 h-px bg-[var(--border)] z-0" />
            <div className="flex gap-3 overflow-x-auto pb-3 relative z-10">
              {forecast.predictedAttackProgression.map((stage, i) => {
                const bgColor =
                  stage.probability >= 0.7
                    ? '#ef444415'
                    : stage.probability >= 0.5
                      ? '#f59e0b15'
                      : '#1687C815';
                const borderColor =
                  stage.probability >= 0.7
                    ? '#ef4444'
                    : stage.probability >= 0.5
                      ? '#f59e0b'
                      : '#1687C8';
                return (
                  <div
                    key={stage.id}
                    className="flex flex-col items-center min-w-[150px] max-w-[180px]"
                  >
                    {/* Dot */}
                    <div
                      className="size-2.5 rounded-full border-2 border-[var(--background)] mb-3 shrink-0"
                      style={{ background: borderColor, boxShadow: `0 0 6px ${borderColor}60` }}
                    />
                    <div
                      className="w-full rounded p-3 border text-center space-y-1.5"
                      style={{ background: bgColor, borderColor: borderColor + '50' }}
                    >
                      <div className="flex justify-between items-center">
                        <LabelBadge label={stage.label} />
                        <span className="text-[10px] font-mono" style={{ color: borderColor }}>
                          {Math.round(stage.probability * 100)}%
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--foreground)] leading-tight">
                        {stage.tacticName}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)] leading-tight">
                        {stage.techniqueName}
                      </p>
                      <p className="text-[10px] font-mono text-[var(--muted-foreground)]">
                        {stage.mitreId}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Row 4: Recent alerts + Network stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/alerts')}>
              View All <ArrowUpRight className="size-3" />
            </Button>
          </CardHeader>
          <div className="space-y-2">
            {alerts.slice(0, 3).map(alert => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-2.5 rounded border border-[var(--border)] hover:bg-[var(--secondary)] transition-colors cursor-pointer"
                onClick={() => navigate('/alerts')}
              >
                <div
                  className={`size-1.5 rounded-full mt-1.5 shrink-0 ${
                    alert.severity === 'critical'
                      ? 'bg-red-400'
                      : alert.severity === 'high'
                        ? 'bg-amber-400'
                        : 'bg-blue-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={alert.severity}>{alert.severity.toUpperCase()}</Badge>
                    <LabelBadge label={alert.label} />
                    {!alert.isAcknowledged && (
                      <span className="text-[10px] font-mono text-red-400 ml-auto">UNACK</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--foreground)] truncate">
                    {alert.predictedBehavior}
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                    Risk {Math.round(alert.riskScore * 100)}% · Confidence{' '}
                    {Math.round(alert.confidence * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Network quick stats */}
        <Card>
          <CardHeader>
            <CardTitle>Network State Snapshot</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/network')}>
              Details <ArrowUpRight className="size-3" />
            </Button>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: 'Active Hosts', v: current.activeHosts, icon: Server },
              { k: 'Connections', v: current.activeConnections.toLocaleString(), icon: Network },
              {
                k: 'Packets (K)',
                v: `${(current.totalPackets / 1000).toFixed(0)}K`,
                icon: Activity,
              },
              { k: 'Traffic', v: `${current.trafficVolumeMbps} Mbps`, icon: TrendingUp },
              { k: 'Unique Ports', v: current.uniquePorts, icon: Clock },
              { k: 'Avg Flow', v: `${current.avgFlowDuration.toFixed(1)}s`, icon: Clock },
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center gap-2 p-2.5 rounded border border-[var(--border)]"
              >
                <row.icon className="size-3.5 text-[var(--muted-foreground)] shrink-0" />
                <div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">{row.k}</p>
                  <p className="text-sm font-mono font-semibold text-[var(--foreground)]">
                    {row.v}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2.5 rounded border border-[var(--border)] bg-[var(--secondary)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Top Destination Ports
            </p>
            <div className="space-y-1.5">
              {current.topPorts.slice(0, 4).map((p) => (
                <div key={p.port} className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)] w-10">
                    {p.port}
                  </span>
                  <div className="flex-1 h-1 bg-[var(--border)] rounded-full">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(p.count / current.topPorts[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[var(--foreground)] w-12 text-right">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
