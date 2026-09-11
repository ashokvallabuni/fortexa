import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ArrowDown, Zap, CheckCircle, Clock, Activity,
  TrendingUp, Network, ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Badge } from '@/components/fx/Badge';
import { Button } from '@/components/fx/Button';
import { DEMO_MODELS, DEMO_FORECAST, DEMO_NETWORK_STATES } from '@/data/mockData';

const PIPELINE = [
  {
    id: 'input',
    label: 'Network State S(t)',
    sublabel: 'Feature vector from current 5-min window',
    color: '#00A8FF',
    icon: Network,
    detail: 'SYN rate, flow counts, port entropy, byte volume, protocol mix, connection frequency — 42 features',
  },
  {
    id: 'encoders',
    label: 'Temporal Encoder + Graph Encoder',
    sublabel: 'Bidirectional LSTM · GraphSAGE with edge attention',
    color: '#1687C8',
    icon: Brain,
    dual: true,
    detail: 'Temporal encoder processes the last 20 network state windows. Graph encoder learns from the IP-host-domain communication graph.',
  },
  {
    id: 'latent',
    label: 'Latent Network State Z(t)',
    sublabel: 'Fused temporal + structural representation',
    color: '#1687C8',
    icon: null,
    detail: 'Compressed 128-dimensional latent vector representing the learned network state embedding.',
  },
  {
    id: 'world',
    label: 'World Model / Dynamics Model',
    sublabel: 'Recurrent State Space Model (RSSM)',
    color: '#00A8FF',
    icon: Brain,
    detail: 'The RSSM learns the transition dynamics of the latent network state — simulating how the network evolves over time without observing future traffic.',
  },
  {
    id: 'futures',
    label: 'Future Network States S(t+1…t+5)',
    sublabel: 'Probabilistic multi-step simulation',
    color: '#f59e0b',
    icon: TrendingUp,
    detail: 'Each simulated future state is decoded back to interpretable network features and a calibrated risk score.',
  },
  {
    id: 'forecast',
    label: 'Attack Forecast + MITRE Mapping',
    sublabel: 'Risk score · Confidence · Tactic estimation',
    color: '#ef4444',
    icon: Activity,
    detail: 'Forecast engine converts latent future states to risk probabilities. MITRE ATT&CK tactics are estimated from predicted behavioral patterns.',
  },
];

const STATUS_COLORS: Record<string, string> = {
  ready: 'text-emerald-400',
  training: 'text-amber-400',
  error: 'text-red-400',
  idle: 'text-[var(--muted-foreground)]',
};

export function WorldModelPage() {
  const [activeStep, setActiveStep] = useState(-1);
  const [simulating, setSimulating] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const currentState = DEMO_NETWORK_STATES[DEMO_NETWORK_STATES.length - 1];
  const nextState = DEMO_FORECAST.states[1];

  // Auto-animate
  useEffect(() => {
    if (simulating) return;
    const interval = setInterval(() => {
      setActiveStep(s => (s + 1) % PIPELINE.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [simulating]);

  const runSim = async () => {
    setSimulating(true);
    setActiveStep(-1);
    await new Promise(r => setTimeout(r, 200));
    for (let i = 0; i < PIPELINE.length; i++) {
      await new Promise(r => setTimeout(r, 550));
      setActiveStep(i);
    }
    await new Promise(r => setTimeout(r, 1000));
    setSimulating(false);
  };

  return (
    <div className="p-4 md:p-5 space-y-5 max-w-screen-xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-base font-semibold">World Model</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Learned network-state dynamics — FORTEXA simulates how the network evolves to forecast future attack risk
          </p>
        </div>
        <Button variant="primary" size="sm" isLoading={simulating} onClick={runSim}>
          <Zap className="size-3.5" /> Simulate Pipeline
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Pipeline — 2 cols */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>State-Transition Pipeline</CardTitle>
            {simulating && <Badge variant="forecast">RUNNING</Badge>}
          </CardHeader>

          <div className="flex flex-col items-center gap-0">
            {PIPELINE.map((step, i) => (
              <div key={step.id} className="flex flex-col items-center w-full">
                <motion.div
                  animate={{
                    borderColor: activeStep === i ? step.color : 'var(--border)',
                    backgroundColor: activeStep === i ? step.color + '18' : 'var(--secondary)',
                  }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => setHovered(step.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="w-full px-4 py-3 rounded border cursor-default relative overflow-hidden"
                >
                  {/* Progress indicator */}
                  {activeStep > i && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="size-3.5 text-emerald-400" />
                    </div>
                  )}
                  {activeStep === i && simulating && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Clock className="size-3.5 animate-spin" style={{ color: step.color }} />
                    </div>
                  )}

                  <div className="flex items-start gap-2.5">
                    {step.icon && (
                      <step.icon className="size-4 mt-0.5 shrink-0 transition-colors" style={{ color: activeStep === i ? step.color : 'var(--muted-foreground)' }} />
                    )}
                    <div>
                      <p className="text-xs font-semibold leading-tight transition-colors" style={{ color: activeStep === i ? step.color : 'var(--foreground)' }}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{step.sublabel}</p>
                    </div>
                  </div>

                  {/* Hover detail */}
                  <AnimatePresence>
                    {hovered === step.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[10px] text-[var(--muted-foreground)] mt-2 leading-relaxed overflow-hidden"
                      >
                        {step.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {i < PIPELINE.length - 1 && (
                  <motion.div
                    animate={{ opacity: activeStep > i ? 1 : 0.3 }}
                    className="flex flex-col items-center py-0.5"
                  >
                    <div className="w-px h-3" style={{ background: step.color + '60' }} />
                    <ArrowDown className="size-3" style={{ color: step.color + '80' }} />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Right col — model cards + state transition */}
        <div className="xl:col-span-3 space-y-4">
          {/* Model cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_MODELS.map(model => (
              <Card key={model.id} padding="sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)]">{model.name}</p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{model.architecture}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <div className={`size-1.5 rounded-full ${model.status === 'ready' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className={`text-[10px] font-mono uppercase ${STATUS_COLORS[model.status]}`}>{model.status}</span>
                  </div>
                </div>

                <p className="text-[10px] text-[var(--muted-foreground)] leading-relaxed mb-3">{model.purpose}</p>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] border-t border-[var(--border)] pt-2 mt-auto">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Version</span>
                    <span className="font-mono text-[var(--foreground)]">v{model.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">Latency</span>
                    <span className="font-mono text-[var(--foreground)]">{model.latencyMs}ms</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-[var(--muted-foreground)]">Updated</span>
                    <span className="font-mono text-[var(--foreground)]">{new Date(model.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* State transition */}
          <Card>
            <CardHeader>
              <CardTitle>State Transition Preview</CardTitle>
              <Badge variant="forecast">+5 MIN PREDICTION</Badge>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Current state */}
              <div className="border border-[var(--border)] rounded p-3 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-2 rounded-full bg-blue-400" />
                  <p className="text-[10px] uppercase tracking-wider text-[var(--primary-blue)] font-semibold">Current State S(t)</p>
                </div>
                {[
                  { k: 'Risk Score', v: `${Math.round(currentState.riskScore * 100)}%`, highlight: 'text-amber-400' },
                  { k: 'SYN Rate', v: `${currentState.synRate} pkt/min`, highlight: '' },
                  { k: 'New Dst Ports', v: `${currentState.newDestinationPorts}`, highlight: '' },
                  { k: 'Connections', v: currentState.activeConnections.toLocaleString(), highlight: '' },
                  { k: 'Traffic', v: `${currentState.trafficVolumeMbps} Mbps`, highlight: '' },
                  { k: 'Anomaly Score', v: `${Math.round(currentState.anomalyScore * 100)}%`, highlight: 'text-red-400' },
                ].map(row => (
                  <div key={row.k} className="flex justify-between text-xs">
                    <span className="text-[var(--muted-foreground)]">{row.k}</span>
                    <span className={`font-mono ${row.highlight || 'text-[var(--foreground)]'}`}>{row.v}</span>
                  </div>
                ))}
              </div>

              {/* Separator */}
              <div className="flex flex-col items-center gap-1.5 py-4">
                <Brain className="size-5 text-[var(--primary-blue)]" />
                <div className="text-center">
                  <p className="text-[10px] text-[var(--muted-foreground)]">World</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">Model</p>
                </div>
                <ChevronRight className="size-4 text-[var(--primary-blue)] hidden md:block" />
                <ArrowDown className="size-4 text-[var(--primary-blue)] md:hidden" />
                <Badge variant="forecast">+1</Badge>
              </div>

              {/* Next state */}
              <div className="border border-[var(--border)] rounded p-3 space-y-2 bg-[var(--secondary)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-2 rounded-full bg-[var(--primary-blue)]" />
                  <p className="text-[10px] uppercase tracking-wider text-[var(--primary-blue)] font-semibold">Predicted S(t+1)</p>
                </div>
                {[
                  { k: 'Risk Score', v: `${Math.round(nextState.predictedRisk * 100)}%`, delta: '+7%', up: true },
                  { k: 'SYN Rate', v: '3,200 pkt/min', delta: '+13%', up: true },
                  { k: 'New Dst Ports', v: '34', delta: '+21%', up: true },
                  { k: 'Connections', v: '7,200', delta: '+7%', up: true },
                  { k: 'Confidence', v: `${Math.round(nextState.confidence * 100)}%`, delta: '', up: false },
                  { k: 'Tactic Est.', v: 'Lateral Mvmt', delta: '', up: false },
                ].map(row => (
                  <div key={row.k} className="flex justify-between items-center text-xs">
                    <span className="text-[var(--muted-foreground)]">{row.k}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[var(--foreground)]">{row.v}</span>
                      {row.delta && (
                        <span className={`text-[10px] font-mono ${row.up ? 'text-red-400' : 'text-emerald-400'}`}>
                          {row.up ? '↑' : '↓'}{row.delta}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-[var(--border)]">
                  <p className="text-[10px] text-[var(--primary-blue)] leading-relaxed">{nextState.potentialTactic}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Future states strip */}
          <Card padding="sm">
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-3">Simulated Future States</p>
            <div className="flex gap-2 overflow-x-auto">
              {DEMO_FORECAST.states.map(state => (
                <div
                  key={state.windowIndex}
                  className="shrink-0 border border-[var(--border)] rounded p-2.5 min-w-[110px] space-y-1.5"
                  style={{
                    borderColor: state.predictedRisk >= 0.8 ? '#FF3B3040' : state.predictedRisk >= 0.6 ? '#F59E0B40' : '#00A8FF40',
                  }}
                >
                  <p className="text-[10px] font-mono font-semibold text-[var(--muted-foreground)]">
                    {state.isObserved ? 'NOW' : `S(t+${state.windowIndex})`}
                  </p>
                  <p
                    className="text-lg font-mono font-bold"
                    style={{ color: state.predictedRisk >= 0.8 ? '#FF3B30' : state.predictedRisk >= 0.6 ? '#F59E0B' : '#00A8FF' }}
                  >
                    {Math.round(state.predictedRisk * 100)}%
                  </p>
                  <p className="text-[10px] text-[var(--primary-blue)] font-mono">{Math.round(state.confidence * 100)}% conf</p>
                  {!state.isObserved && (
                    <Badge variant="forecast">PRED</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
