import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Badge } from '@/components/fx/Badge';
import { DEMO_FEATURE_CONTRIBUTIONS, DEMO_FORECAST } from '@/data/mockData';
import type { FeatureContribution } from '@/types';

interface ExplainabilityTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: FeatureContribution }>;
}

const CustomTooltip = ({ active, payload }: ExplainabilityTooltipProps) => {
  if (!active || !payload?.[0]) return null;
  const f = payload[0].payload;
  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded p-3 text-xs max-w-xs shadow-xl">
      <p className="font-semibold text-[var(--foreground)] mb-1.5">{f.feature}</p>
      <p className="text-[var(--muted-foreground)] leading-relaxed mb-2">{f.description}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        <div>
          <span className="text-[var(--muted-foreground)]">Contribution</span>
          <p className="font-mono text-amber-400">+{f.contribution.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">Observed</span>
          <p className="font-mono text-[var(--foreground)]">{f.value} {f.unit ?? ''}</p>
        </div>
      </div>
    </div>
  );
};

export function ExplainabilityPage() {
  const [selectedFeature, setSelectedFeature] = useState<typeof DEMO_FEATURE_CONTRIBUTIONS[number] | null>(null);
  const sorted = [...DEMO_FEATURE_CONTRIBUTIONS].sort((a, b) => b.contribution - a.contribution);

  const radarData = sorted.slice(0, 6).map(f => ({
    subject: f.feature.split(' ')[0],
    value: f.contribution / 0.24,
    fullMark: 1,
  }));

  return (
    <div className="p-4 md:p-5 space-y-5 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-base font-semibold">Why This Forecast?</h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
          SHAP-style model contribution analysis · These reflect model inputs, not confirmed attacker intentions
        </p>
      </div>

      {/* Context banner */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-[var(--secondary)] border border-[var(--border)] rounded text-xs">
        <Badge variant="forecast">MODEL CONTRIBUTION</Badge>
        <span className="text-[var(--muted-foreground)]">
          Forecast ID: <span className="font-mono text-[var(--foreground)]">{DEMO_FORECAST.id.slice(-12)}</span>
          {' · '}
          Model: <span className="font-mono text-[var(--foreground)]">{DEMO_FORECAST.modelVersion}</span>
          {' · '}
          Overall Confidence: <span className="font-mono text-[var(--primary-blue)]">{Math.round(DEMO_FORECAST.overallConfidence * 100)}%</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Horizontal bar chart */}
        <Card className="lg:col-span-3" padding="none">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle>Feature Contributions (SHAP-Style)</CardTitle>
          </CardHeader>
          <div className="h-72 px-2 pb-3">
            <ResponsiveContainer>
              <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 0.28]} tickFormatter={v => `+${v.toFixed(2)}`} tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="feature" width={150} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)' }} />
                <Bar dataKey="contribution" radius={[0, 2, 2, 0]} onClick={(data) => setSelectedFeature(data as FeatureContribution)}>
                  {sorted.map((entry, i) => (
                    <Cell key={i} fill={`hsl(${28 + i * 18}, 80%, ${58 - i * 2}%)`} opacity={selectedFeature?.feature === entry.feature ? 1 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Radar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contribution Profile</CardTitle>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                <Radar dataKey="value" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {selectedFeature && (
            <div className="border-t border-[var(--border)] pt-3 mt-2 space-y-1.5 text-xs">
              <p className="font-semibold text-[var(--foreground)]">{selectedFeature.feature}</p>
              <p className="text-[var(--muted-foreground)] leading-relaxed text-[10px]">{selectedFeature.description}</p>
              <div className="flex justify-between pt-1">
                <span className="text-[var(--muted-foreground)]">Value</span>
                <span className="font-mono text-[var(--foreground)]">{selectedFeature.value} {selectedFeature.unit ?? ''}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Feature table */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Detail</CardTitle>
          <p className="text-[10px] text-[var(--muted-foreground)]">Click bar chart to highlight · Model contribution, not attacker intent</p>
        </CardHeader>
        <div className="space-y-3">
          {sorted.map((f, i) => (
            <div
              key={f.feature}
              className={`border-b border-[var(--border)] pb-3 last:border-0 last:pb-0 cursor-pointer rounded px-1 transition-colors ${selectedFeature?.feature === f.feature ? 'bg-[var(--secondary)]' : ''}`}
              onClick={() => setSelectedFeature(selectedFeature?.feature === f.feature ? null : f)}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[10px] font-mono text-[var(--muted-foreground)] w-4 shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--foreground)]">{f.feature}</span>
                    <span className="text-xs font-mono text-amber-400 ml-2">+{f.contribution.toFixed(2)}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(f.contribution / 0.24) * 100}%`,
                        background: `hsl(${28 + i * 18}, 80%, ${58 - i * 2}%)`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[var(--foreground)] shrink-0 w-20 text-right">
                  {f.value} {f.unit ?? ''}
                </span>
              </div>
              <div className="ml-7">
                <p className="text-[10px] text-[var(--muted-foreground)] leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Caveats */}
      <Card className="bg-[var(--secondary)]">
        <CardHeader>
          <CardTitle>Analyst Guidance</CardTitle>
        </CardHeader>
        <ul className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
          <li className="flex gap-2"><span className="text-[var(--primary-blue)] shrink-0">·</span>Feature contributions indicate which network signals most influenced the risk prediction — not confirmed attack behaviors</li>
          <li className="flex gap-2"><span className="text-[var(--primary-blue)] shrink-0">·</span>SHAP-style attribution is a model explanation tool — treat as analytical context, not forensic evidence</li>
          <li className="flex gap-2"><span className="text-[var(--primary-blue)] shrink-0">·</span>Confidence of {Math.round(DEMO_FORECAST.overallConfidence * 100)}% reflects model uncertainty, not attack certainty</li>
          <li className="flex gap-2"><span className="text-[var(--primary-blue)] shrink-0">·</span>Analyst validation with additional telemetry is required before taking any action</li>
          <li className="flex gap-2"><span className="text-[var(--primary-blue)] shrink-0">·</span>Do not share forecast outputs as confirmed threat intelligence without human review</li>
        </ul>
      </Card>
    </div>
  );
}
