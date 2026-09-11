import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area,
} from 'recharts';
import type { ForecastState } from '@/types';

interface ForecastChartProps {
  states: ForecastState[];
}

interface ForecastTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: ForecastState & { t: string } }>;
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: ForecastTooltipProps) => {
  if (!active || !payload?.length) return null;
  const state = payload[0]?.payload as ForecastState & { t: string };
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded p-3 text-xs shadow-xl max-w-xs">
      <p className="font-mono text-[var(--muted-foreground)] mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[var(--muted-foreground)]">Risk</span>
          <span className="font-mono text-[var(--foreground)]">{(state?.predictedRisk * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--muted-foreground)]">Confidence</span>
          <span className="font-mono text-[var(--primary-blue)]">{(state?.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
      {state?.potentialTactic && (
        <p className="mt-2 text-[var(--muted-foreground)] leading-relaxed">{state.potentialTactic}</p>
      )}
    </div>
  );
};

export function ForecastChart({ states }: ForecastChartProps) {
  const data = states.map(s => ({
    ...s,
    t: s.isObserved ? 'NOW' : `+${s.windowIndex}`,
    riskPct: s.predictedRisk,
    confPct: s.confidence,
    upper: Math.min(s.predictedRisk + (1 - s.confidence) * 0.12, 1),
    lower: Math.max(s.predictedRisk - (1 - s.confidence) * 0.08, 0),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--primary-blue)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0.6} stroke="var(--warning)" strokeDasharray="3 3" strokeOpacity={0.5} />
        <ReferenceLine y={0.8} stroke="var(--critical)" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Area type="monotone" dataKey="upper" stroke="none" fill="var(--border)" fillOpacity={0.3} />
        <Area type="monotone" dataKey="lower" stroke="none" fill="var(--background)" fillOpacity={1} />
        <Bar dataKey="riskPct" name="Risk Score" fill="url(#riskGrad)" radius={[2, 2, 0, 0]} maxBarSize={40}
          label={false}
        />
        <Line type="monotone" dataKey="confPct" name="Confidence" stroke="var(--secondary-blue)" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3, fill: 'var(--secondary-blue)' }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
