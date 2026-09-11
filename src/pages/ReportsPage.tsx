import { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Button } from '@/components/fx/Button';
import { Badge, LabelBadge, RiskBadge } from '@/components/fx/Badge';
import { DEMO_FORECAST, DEMO_FEATURE_CONTRIBUTIONS, DEMO_ALERTS } from '@/data/mockData';

export function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);

  const generate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerated(true);
    setGenerating(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-screen-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--foreground)]">Reports</h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Forecast intelligence reports for analyst review
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Printer className="size-3" /> Print
          </Button>
          <Button variant="primary" size="sm" isLoading={generating} onClick={generate}>
            <Download className="size-3" /> Generate Report
          </Button>
        </div>
      </div>

      {generated && (
        <div className="space-y-4">
          {/* Report header */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-blue-400" />
                  <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">
                    FORTEXA Forecast Intelligence Report
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--muted-foreground)]">Generated</span>
                    <p className="font-mono">{new Date().toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Analyst</span>
                    <p className="font-mono">SOC Analyst</p>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Classification</span>
                    <p className="font-mono">UNCLASSIFIED</p>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)]">Model</span>
                    <p className="font-mono">{DEMO_FORECAST.modelVersion}</p>
                  </div>
                </div>
              </div>
              <Badge variant="high">HIGH RISK</Badge>
            </div>
          </Card>

          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <LabelBadge label="observed" />
            </CardHeader>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              The FORTEXA world model has identified a high-confidence escalating risk pattern in
              the enterprise network. Current risk score is{' '}
              <strong className="text-amber-400">72% (HIGH)</strong>. Behavioral analysis indicates
              potential lateral movement activity originating from host 10.0.1.42, with active SMB
              connections to domain controller and file server infrastructure. The predictive
              forecast indicates risk escalation to{' '}
              <strong className="text-red-400">CRITICAL (87–93%)</strong> within 3–5 network windows
              (15–25 minutes) without intervention.
            </p>
          </Card>

          {/* Network State */}
          <Card>
            <CardHeader>
              <CardTitle>Observed Network State</CardTitle>
              <LabelBadge label="observed" />
            </CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { k: 'SYN Rate', v: '2,840 pkt/min', highlight: true },
                { k: 'Active Hosts', v: '180' },
                { k: 'Active Connections', v: '6,740' },
                { k: 'New Dst Ports', v: '28 (window)', highlight: true },
                { k: 'Traffic Volume', v: '320 Mbps', highlight: true },
                { k: 'Retransmission', v: '12%', highlight: true },
                { k: 'Unique Ports', v: '124' },
                { k: 'Avg Flow Duration', v: '1.8 sec' },
              ].map((row) => (
                <div key={row.k}>
                  <p className="text-[var(--muted-foreground)]">{row.k}</p>
                  <p
                    className={`font-mono font-semibold ${row.highlight ? 'text-amber-400' : 'text-[var(--foreground)]'}`}
                  >
                    {row.v}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Forecast */}
          <Card>
            <CardHeader>
              <CardTitle>Attack Forecast</CardTitle>
              <LabelBadge label="forecast" />
            </CardHeader>
            <div className="space-y-2">
              {DEMO_FORECAST.states.map((state) => (
                <div
                  key={state.windowIndex}
                  className="flex items-center gap-3 text-xs border-b border-[var(--border)] pb-2 last:border-0 last:pb-0"
                >
                  <span className="font-mono text-[var(--muted-foreground)] w-10 shrink-0">
                    {state.isObserved ? 'NOW' : `+${state.windowIndex}`}
                  </span>
                  <div className="w-20 h-1.5 bg-[var(--border)] rounded-full shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${state.predictedRisk * 100}%`,
                        background: state.predictedRisk >= 0.8 ? '#FF3B30' : '#F59E0B',
                      }}
                    />
                  </div>
                  <span className="font-mono text-amber-400 w-10 shrink-0">
                    {Math.round(state.predictedRisk * 100)}%
                  </span>
                  <span className="text-[var(--primary-blue)] font-mono w-12 shrink-0">
                    {Math.round(state.confidence * 100)}% conf
                  </span>
                  <span className="text-[var(--muted-foreground)] truncate">
                    {state.potentialTactic}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* MITRE */}
          <Card>
            <CardHeader>
              <CardTitle>MITRE ATT&CK Mapping</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {DEMO_FORECAST.predictedAttackProgression.map((stage) => (
                <div key={stage.id} className="flex items-start gap-3 text-xs">
                  <LabelBadge label={stage.label} />
                  <Badge variant="outline">{stage.mitreId}</Badge>
                  <div className="flex-1">
                    <span className="text-[var(--foreground)] font-medium">{stage.tacticName}</span>
                    <span className="text-[var(--muted-foreground)] ml-2">
                      {stage.techniqueName}
                    </span>
                  </div>
                  <span className="font-mono text-[var(--muted-foreground)] shrink-0">
                    {Math.round(stage.probability * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Explainability */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Contributions</CardTitle>
              <LabelBadge label="observed" />
            </CardHeader>
            <div className="space-y-2">
              {DEMO_FEATURE_CONTRIBUTIONS.map((f) => (
                <div key={f.feature} className="flex items-center gap-3 text-xs">
                  <span className="text-[var(--foreground)] w-40 shrink-0">{f.feature}</span>
                  <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${(f.contribution / 0.24) * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-amber-400 w-12 text-right shrink-0">
                    +{f.contribution.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Defensive Actions</CardTitle>
              <LabelBadge label="recommendation" />
            </CardHeader>
            <ol className="space-y-2 text-xs text-[var(--muted-foreground)]">
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">1.</span> Isolate host 10.0.1.42 from
                the network pending investigation. Verify whether this is a legitimate admin
                session.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">2.</span> Audit authentication logs on
                DC01 (192.168.10.5) for the last 60 minutes. Look for unusual account creation or
                privilege escalation.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">3.</span> Review SMB access logs on
                FILE01 (192.168.10.8). Check for unusual file access or staging behavior.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">4.</span> Block outbound HTTPS to
                external IP 203.0.113.55 pending threat intelligence review.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-400 shrink-0">5.</span> Activate enhanced monitoring
                on all domain controller traffic for the next 30 minutes.
              </li>
            </ol>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-3 italic">
              These are model-assisted recommendations based on predicted behavior. Analyst judgment
              is required before taking action.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
