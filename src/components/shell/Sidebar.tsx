import { NavLink } from '@/lib/router-compat';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Network,
  GitBranch,
  Clock,
  TrendingUp,
  Brain,
  HelpCircle,
  MessageSquare,
  Bell,
  FileText,
  FlaskConical,
  Database,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth, type WorkspaceKey } from '@/hooks/useAuth';
import type { LucideIcon } from 'lucide-react';

type NavGroup = { label: string; items: Array<{ to: string; label: string; icon: LucideIcon }> };

const NAV_GROUPS: Record<WorkspaceKey, NavGroup[]> = {
  admin: [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin', label: 'Admin Console', icon: Shield },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/network', label: 'Network', icon: Network },
      { to: '/graph', label: 'Graph', icon: GitBranch },
      { to: '/attack-timeline', label: 'Attack Timeline', icon: Clock },
    ],
  },
  {
    label: 'AI ENGINE',
    items: [
      { to: '/forecast', label: 'Forecast', icon: TrendingUp },
      { to: '/world-model', label: 'World Model', icon: Brain },
      { to: '/explainability', label: 'Explainability', icon: HelpCircle },
      { to: '/copilot', label: 'AI Copilot', icon: MessageSquare },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/alerts', label: 'Alerts', icon: Bell },
      { to: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'RESEARCH',
    items: [{ to: '/evaluation', label: 'Evaluation', icon: FlaskConical }],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/datasets', label: 'Datasets', icon: Database },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  ],
  security: [
    { label: 'SECURITY', items: [{ to: '/dashboard', label: 'Security Overview', icon: LayoutDashboard }, { to: '/alerts', label: 'Alerts', icon: Bell }, { to: '/attack-timeline', label: 'Threat Timeline', icon: Clock }, { to: '/reports', label: 'Reports', icon: FileText }] },
    { label: 'MONITORING', items: [{ to: '/network', label: 'Network Overview', icon: Network }, { to: '/graph', label: 'Network Graph', icon: GitBranch }] },
  ],
  soc: [
    { label: 'SOC', items: [{ to: '/dashboard', label: 'SOC Overview', icon: LayoutDashboard }, { to: '/alerts', label: 'Alerts', icon: Bell }, { to: '/forecast', label: 'Attack Forecast', icon: TrendingUp }, { to: '/graph', label: 'Network Graph', icon: GitBranch }, { to: '/attack-timeline', label: 'Threat Timeline', icon: Clock }] },
    { label: 'ANALYSIS', items: [{ to: '/explainability', label: 'Explainability', icon: HelpCircle }, { to: '/reports', label: 'Reports', icon: FileText }] },
  ],
  network: [
    { label: 'NETWORK', items: [{ to: '/network', label: 'Network Overview', icon: Network }, { to: '/graph', label: 'Network Graph', icon: GitBranch }, { to: '/attack-timeline', label: 'Network States', icon: Clock }] },
    { label: 'DATA', items: [{ to: '/ingestion', label: 'Data Sources', icon: Database }, { to: '/datasets', label: 'Datasets', icon: Database }] },
  ],
  research: [
    { label: 'RESEARCH', items: [{ to: '/dashboard', label: 'Research Overview', icon: LayoutDashboard }, { to: '/datasets', label: 'Dataset Lab', icon: Database }, { to: '/evaluation', label: 'Evaluation', icon: FlaskConical }] },
    { label: 'MODELS', items: [{ to: '/world-model', label: 'Model Versions', icon: Brain }, { to: '/explainability', label: 'Explainability', icon: HelpCircle }] },
  ],
};

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const { identity } = useAuth();
  const groups = NAV_GROUPS[identity.workspace ?? 'soc'];
  return (
    <aside
      className={clsx(
        'flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] transition-all duration-200 shrink-0 relative',
        collapsed ? 'w-12' : 'w-52',
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex items-center border-b border-[var(--border)] h-12 shrink-0 overflow-hidden',
          collapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
        )}
      >
        <div className="size-6 rounded-sm bg-[var(--secondary-blue)] flex items-center justify-center shrink-0">
          <Shield className="size-3.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-xs font-bold tracking-widest text-[var(--foreground)] uppercase whitespace-nowrap">
            FORTEXA
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <p className="text-[9px] font-semibold text-[var(--muted-foreground)] uppercase tracking-widest px-3 py-1.5 mt-2">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-1.5" />}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 text-xs font-medium transition-colors duration-100 relative',
                    collapsed ? 'justify-center py-2.5 px-0 mx-1 rounded' : 'px-3 py-1.5',
                    isActive
                      ? collapsed
                        ? 'text-[var(--primary-blue)] bg-[var(--sidebar-accent)]'
                        : 'text-[var(--foreground)] bg-[var(--secondary)] border-r-2 border-[var(--primary-blue)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="size-3.5 shrink-0" />
                {!collapsed && item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Version */}
      {!collapsed && (
        <div className="border-t border-[var(--border)] px-3 py-2">
          <p className="text-[9px] font-mono text-[var(--muted-foreground)]">v2.1.4 · FORTEXA</p>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 size-6 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] z-10 shadow-sm transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
      </button>
    </aside>
  );
}
