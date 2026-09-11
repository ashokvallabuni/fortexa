import { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Button } from '@/components/fx/Button';
import { Badge } from '@/components/fx/Badge';
import { useAuth } from '@/hooks/useAuth';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-[var(--border)]'}`}
    >
      <span
        className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`}
      />
    </button>
  );
}

function Setting({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
      <div>
        <p className="text-xs font-medium text-[var(--foreground)]">{label}</p>
        {description && (
          <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { user, identity } = useAuth();
  const [forecastAuto, setForecastAuto] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [horizon, setHorizon] = useState(5);

  return (
    <div className="p-4 space-y-4 max-w-screen-lg mx-auto">
      <h1 className="text-base font-semibold text-[var(--foreground)]">Settings</h1>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <div>
          <Setting label="Name" description="Authenticated profile">{identity.profile?.displayName ?? user?.user_metadata?.full_name ?? 'Not configured'}</Setting>
          <Setting label="Email" description="Managed by Supabase Auth">{user?.email ?? 'Not available'}</Setting>
          <Setting label="Role" description="Database-backed workspace role"><Badge variant="safe">{identity.role?.replaceAll('_', ' ') ?? 'UNASSIGNED'}</Badge></Setting>
          <Setting label="Organization" description="Current membership">{identity.organization?.name ?? 'Not configured'}</Setting>
        </div>
      </Card>

      {/* Forecast config */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Configuration</CardTitle>
        </CardHeader>
        <div>
          <Setting
            label="Auto-run Forecast"
            description="Automatically run forecast on new data ingestion"
          >
            <Toggle checked={forecastAuto} onChange={setForecastAuto} />
          </Setting>
          <Setting label="Default Horizon" description="Default forecast window horizon">
            <div className="flex gap-1">
              {[3, 5, 10].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={`px-2.5 py-1 text-xs rounded border font-mono transition-colors ${horizon === h ? 'bg-blue-600 text-white border-blue-600' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </Setting>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <div>
          <Setting label="Enable Alerts" description="Show alerts for high-risk forecasts">
            <Toggle checked={alertsEnabled} onChange={setAlertsEnabled} />
          </Setting>
          <Setting label="Critical Threshold" description="Risk score to trigger critical alert">
            <span className="text-xs font-mono text-red-400">≥ 80%</span>
          </Setting>
          <Setting label="High Threshold" description="Risk score to trigger high alert">
            <span className="text-xs font-mono text-amber-400">≥ 60%</span>
          </Setting>
        </div>
      </Card>

      {/* System info */}
      <Card>
        <CardHeader><CardTitle>System Information & Integrations</CardTitle></CardHeader>
        <div>
          {[
            { k: 'Platform', v: 'FORTEXA v2.1.4' },
            { k: 'Backend Engine', v: 'Supabase PostgreSQL + TanStack Start' },
            { k: 'Supabase Project', v: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'Not configured' },
            { k: 'Supabase URL', v: import.meta.env.VITE_SUPABASE_URL || 'Not configured' },
            { k: 'Supabase Integration', v: 'Environment configured' },
            { k: 'Frontend', v: 'React 19 + Vite 8 + Tailwind CSS v4' },
            { k: 'Build Mode', v: import.meta.env.MODE },
          ].map((row) => (
            <Setting key={row.k} label={row.k}>
              <span className="text-xs font-mono text-[var(--muted-foreground)]">{row.v}</span>
            </Setting>
          ))}
        </div>
      </Card>
    </div>
  );
}
