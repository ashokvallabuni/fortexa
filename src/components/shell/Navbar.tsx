import { useLocation } from '@/lib/router-compat';
import {
  Search,
  Sun,
  Moon,
  User,
  Wifi,
  Database,
  ChevronRight,
  Shield,
  LogOut,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

const ROUTE_LABELS: Record<string, string[]> = {
  '/': ['Home'],
  '/dashboard': ['Dashboard'],
  '/ingestion': ['System', 'Data Ingestion'],
  '/datasets': ['System', 'Datasets'],
  '/network': ['Intelligence', 'Network'],
  '/forecast': ['AI Engine', 'Forecast'],
  '/world-model': ['AI Engine', 'World Model'],
  '/attack-timeline': ['Intelligence', 'Attack Timeline'],
  '/graph': ['Intelligence', 'Graph'],
  '/explainability': ['AI Engine', 'Explainability'],
  '/copilot': ['AI Engine', 'AI Copilot'],
  '/alerts': ['Operations', 'Alerts'],
  '/evaluation': ['Research', 'Evaluation'],
  '/reports': ['Operations', 'Reports'],
  '/settings': ['System', 'Settings'],
  '/admin': ['Control Plane', 'Admin Console'],
};

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const { user, identity, signOut } = useAuth();

  const workspaceName = identity.workspace ? identity.workspace === 'admin' ? 'PLATFORM ADMINISTRATION' : `${identity.workspace.toUpperCase()} OPERATIONS` : 'INITIALIZING WORKSPACE';
  const segments = ['FORTEXA', workspaceName, ...(ROUTE_LABELS[location.pathname] ?? ['...'])];

  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--card)] flex items-center px-4 gap-3 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] min-w-0 shrink-0">
        {segments.map((seg, i) => (
          <span key={`${seg}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3 text-[var(--border)] shrink-0" />}
            <span
              className={
                i === segments.length - 1
                  ? 'text-[var(--foreground)] font-medium'
                  : 'hidden sm:inline'
              }
            >
              {seg}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-sm mx-auto hidden md:block relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[var(--muted-foreground)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search IPs, entities, alerts…"
          className="w-full h-7 pl-7 pr-3 text-xs bg-[var(--secondary)] border border-[var(--border)] rounded text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* System status */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
          <Wifi className="size-3 text-emerald-600" />
          <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wide">
            OPERATIONAL
          </span>
        </div>

        {/* Dataset */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--muted)] border border-[var(--border)]">
          <Database className="size-3 text-[var(--primary-blue)]" />
          <span className="text-[10px] font-mono text-[var(--secondary-foreground)]">CIC-IDS2018</span>
        </div>

        {/* Model version */}
        <span className="hidden lg:block text-[10px] font-mono text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-1 rounded">
          v2.1.4
        </span>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="size-7 flex items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
          title="Toggle light/dark mode"
        >
          {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
          <div className="size-7 rounded bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center">
            <User className="size-3.5 text-[var(--primary-blue)]" />
          </div>
          <div className="hidden md:block">
            <p className="text-[10px] font-medium text-[var(--foreground)] leading-none">
              {user?.user_metadata?.full_name ?? user?.email ?? 'Authenticated user'}
            </p>
            <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5">
              {identity.role?.replaceAll('_', ' ') ?? 'Role pending'}
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            className="size-7 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
