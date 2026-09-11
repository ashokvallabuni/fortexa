import { NavLink } from '@/lib/router-compat';
import { LayoutDashboard, TrendingUp, Network, Bell, Database } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/hooks/useAuth';

export function MobileNav() {
  const { identity } = useAuth();
  const mobileNav = identity.workspace === 'admin'
    ? [{ to: '/admin', label: 'Admin', icon: LayoutDashboard }, { to: '/settings', label: 'Settings', icon: Database }]
    : identity.workspace === 'network'
      ? [{ to: '/network', label: 'Network', icon: Network }, { to: '/ingestion', label: 'Data', icon: Database }]
      : [{ to: '/dashboard', label: 'Home', icon: LayoutDashboard }, { to: '/forecast', label: 'Forecast', icon: TrendingUp }, { to: '/alerts', label: 'Alerts', icon: Bell }, { to: '/graph', label: 'Graph', icon: Network }];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--card)] border-t border-[var(--border)] flex items-center justify-around z-50">
      {mobileNav.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => clsx(
            'flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors',
            isActive ? 'text-[#2563EB]' : 'text-[var(--muted-foreground)]',
          )}
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
