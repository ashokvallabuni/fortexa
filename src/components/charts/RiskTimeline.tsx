import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import type { NetworkState } from '@/types';
import type { ForecastState } from '@/types';

interface RiskTimelineProps {
  observed: NetworkState[];
  forecast?: ForecastState[];
}

interface RiskTooltipEntry {
  name?: string;
  color?: string;
  value?: number;
}

interface RiskTooltipProps {
  active?: boolean;
  payload?: RiskTooltipEntry[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: RiskTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded p-2.5 text-xs shadow-xl">
      <p className="text-[var(--muted-foreground)] mb-1.5 font-mono">{label}</p>
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-[var(--muted-foreground)]">{entry.name}</span>
          <span className="font-mono font-medium text-[var(--foreground)]">{((entry.value ?? 0) * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
};

export function RiskTimeline({ observed, forecast }: RiskTimelineProps) {
  const observedData = observed.map((s, i) => ({
    t: `W${s.windowId}`,
    observed: s.riskScore,
    full: null,
  }));

  const forecastData = forecast?.slice(1).map((f, i) => ({
    t: `+${i + 1}`,
    observed: null,
    predicted: f.predictedRisk,
    confidenceLow: f.predictedRisk - (1 - f.confidence) * 0.15,
    confidenceHigh: f.predictedRisk + (1 - f.confidence) * 0.1,
  })) ?? [];

  // Join at the last observed point
  const lastObserved = observedData[observedData.length - 1];
  const combined = [
    ...observedData,
    ...(forecast ? [{ t: '+0', observed: lastObserved?.observed, predicted: forecast[0].predictedRisk }] : []),
    ...forecastData,
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={combined} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary-blue)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary-blue)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--secondary-blue)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--secondary-blue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--muted-foreground)' }} />
        <ReferenceLine x="+0" stroke="var(--border)" strokeDasharray="4 2" label={{ value: 'NOW', position: 'top', fill: 'var(--muted-foreground)', fontSize: 10 }} />
        <ReferenceLine y={0.6} stroke="var(--warning)" strokeDasharray="3 3" strokeOpacity={0.4} />
        <ReferenceLine y={0.8} stroke="var(--critical)" strokeDasharray="3 3" strokeOpacity={0.4} />
        <Area type="monotone" dataKey="observed" name="Observed Risk" stroke="var(--primary-blue)" strokeWidth={2} fill="url(#observedGrad)" connectNulls={false} dot={false} activeDot={{ r: 3 }} />
        <Area type="monotone" dataKey="predicted" name="Predicted Risk" stroke="var(--secondary-blue)" strokeWidth={2} strokeDasharray="6 3" fill="url(#predictedGrad)" connectNulls={false} dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
