import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Brain,
  Network,
  AlertTriangle,
  Activity,
  Lock,
  Zap,
} from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const ARCH = [
  { label: 'Network Traffic', sub: 'PCAP · NetFlow · IPFIX', color: '#00A8FF', icon: Network },
  {
    label: 'Network State S(t)',
    sub: 'Feature extraction · Windowing',
    color: '#1687C8',
    icon: null,
  },
  {
    label: 'Temporal Encoder + Graph GNN',
    sub: 'BiLSTM · GraphSAGE',
    color: '#1687C8',
    icon: Brain,
  },
  {
    label: 'Latent State Z(t) → World Model',
    sub: 'Recurrent State Space Model (RSSM)',
    color: '#00A8FF',
    icon: null,
  },
  {
    label: 'Future-State Simulation',
    sub: 'S(t+1) → S(t+2) → … → S(t+5)',
    color: '#1687C8',
    icon: null,
  },
  {
    label: 'Attack Forecast',
    sub: 'Risk score · Confidence · MITRE mapping',
    color: '#f59e0b',
    icon: TrendingUp,
  },
  {
    label: 'Early Warning',
    sub: 'Analyst alert · Copilot briefing · Report',
    color: '#ef4444',
    icon: AlertTriangle,
  },
];

const CAPABILITIES = [
  {
    icon: TrendingUp,
    title: 'Predictive Forecasting',
    desc: 'World model simulates future network states up to 5 windows ahead with calibrated confidence scores.',
  },
  {
    icon: Brain,
    title: 'Temporal Intelligence',
    desc: 'Bidirectional LSTM encoder captures evolving behavioral patterns across time windows.',
  },
  {
    icon: Network,
    title: 'Graph Neural Network',
    desc: 'GraphSAGE propagates risk signals across the network topology — IP, host, server, domain relationships.',
  },
  {
    icon: Lock,
    title: 'Explainable AI',
    desc: 'SHAP-style feature attribution shows exactly which network signals drove each forecast.',
  },
  {
    icon: Activity,
    title: 'MITRE ATT&CK Mapping',
    desc: 'Predicted behaviors mapped to ATT&CK tactics — Reconnaissance, Lateral Movement, C2, Exfiltration.',
  },
  {
    icon: Zap,
    title: 'Early Warning',
    desc: 'Forecast alerts trigger before attack confirmation — giving analysts 5–25 minutes of lead time.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-[var(--secondary-blue)] rounded-sm flex items-center justify-center">
              <Shield className="size-4.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest uppercase">FORTEXA</span>
              <span className="hidden sm:inline text-[10px] text-[var(--muted-foreground)] ml-3 font-mono">
                AI Network Attack Forecasting
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs text-[var(--muted-foreground)] border border-[var(--border)] px-2.5 py-1 rounded font-mono">
              SECURE ACCESS
            </span>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue)] text-white text-sm font-medium rounded transition-colors"
            >
              Command Center <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-4xl">
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 font-mono"
          >
            <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
            Predictive defence platform · AI-powered · enterprise-ready
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-6xl md:text-8xl font-bold tracking-tighter leading-none mb-6"
          >
            FORTEXA
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-2xl md:text-3xl font-light text-[var(--muted-foreground)] mb-4 leading-snug"
          >
            Forecast the Threat.
            <br />
            <span className="text-[var(--foreground)] font-medium">Fortify Before Impact.</span>
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-base text-[var(--muted-foreground)] max-w-2xl mb-10 leading-relaxed"
          >
            AI-powered network attack forecasting using temporal intelligence, graph neural networks
            and learned network-state dynamics. Not an intrusion detection system — a{' '}
            <strong className="text-[var(--foreground)]">predictive defence platform</strong>.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 bg-[var(--secondary-blue)] hover:bg-[var(--primary-blue)] text-white font-medium rounded transition-colors text-sm"
            >
              Enter Command Center <ArrowRight className="size-4" />
            </button>
            <button
              onClick={() => navigate('/world-model')}
              className="flex items-center justify-center gap-2.5 px-6 py-3 border border-[var(--border)] hover:border-blue-500/50 text-[var(--foreground)] font-medium rounded transition-colors text-sm"
            >
              Explore World Model <Brain className="size-4" />
            </button>
          </motion.div>
        </motion.div>

        {/* Paradigm comparison */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 items-center max-w-2xl"
        >
          <div className="border border-[var(--border)] rounded p-4 opacity-60">
            <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
              Traditional IDS
            </p>
            <p className="text-sm font-medium line-through text-[var(--muted-foreground)]">
              Reactive Detection
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">"What is happening now?"</p>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="size-6 text-blue-400 rotate-0 md:rotate-0" />
          </div>
          <div className="border border-blue-500/30 rounded p-4 bg-blue-500/5">
            <p className="text-[10px] uppercase tracking-widest text-blue-400 mb-2">FORTEXA</p>
            <p className="text-sm font-semibold text-blue-400">Predictive Defence</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              "What is likely to happen next?"
            </p>
          </div>
        </motion.div>
      </section>

      {/* Architecture */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                System Architecture
              </p>
              <h2 className="text-3xl font-bold mb-4">How FORTEXA Forecasts Attacks</h2>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-8">
                FORTEXA ingests raw network traffic, builds a structured network state vector, and
                feeds it through a temporal encoder and graph neural network into a learned world
                model — a dynamics model that simulates how network behavior evolves, enabling
                probabilistic attack forecasting well before any attack is confirmed.
              </p>
              <button
                onClick={() => navigate('/world-model')}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Explore the World Model <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-0">
              {ARCH.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="flex flex-col items-center w-full"
                >
                  <div
                    className="w-full max-w-sm flex items-center gap-3 px-4 py-2.5 rounded border"
                    style={{ borderColor: step.color + '40', background: step.color + '0d' }}
                  >
                    {step.icon && (
                      <step.icon className="size-4 shrink-0" style={{ color: step.color }} />
                    )}
                    <div>
                      <p className="text-sm font-medium" style={{ color: step.color }}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">{step.sub}</p>
                    </div>
                  </div>
                  {i < ARCH.length - 1 && (
                    <div className="w-px h-4" style={{ background: step.color + '40' }} />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
          Capabilities
        </p>
        <h2 className="text-2xl font-bold mb-10">Enterprise-Grade Predictive Intelligence</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="border border-[var(--border)] rounded p-5 hover:border-blue-500/30 transition-colors"
            >
              <cap.icon className="size-5 text-blue-400 mb-3" />
              <p className="text-sm font-semibold mb-2">{cap.title}</p>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{cap.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)] bg-[var(--card)] py-16">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-2xl font-bold mb-3">Ready to explore the platform?</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-8">
            Import an official dataset or authorized network capture and run the governed workflow
            from normalization through explainable attack forecasting.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/ingestion')}
              className="px-6 py-3 border border-[var(--border)] hover:border-blue-500/50 text-sm font-medium rounded transition-colors"
            >
              Browse Datasets
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 justify-center"
            >
              Enter Command Center <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <div className="size-5 bg-blue-600 rounded-sm flex items-center justify-center">
              <Shield className="size-3 text-white" />
            </div>
            <span className="font-bold tracking-wider uppercase">FORTEXA</span>
            <span>·</span>
            <span>Secure network intelligence</span>
          </div>
          <p className="font-mono">AUTHENTICATED ACCESS · PROVENANCE TRACKED</p>
        </div>
      </footer>
    </div>
  );
}
