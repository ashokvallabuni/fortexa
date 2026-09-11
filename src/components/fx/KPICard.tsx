import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accent?: 'critical' | 'high' | 'medium' | 'low' | 'safe' | 'forecast' | 'default';
  className?: string;
}

const accentColors = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  medium: 'text-orange-400',
  low: 'text-[var(--primary-blue)]',
  safe: 'text-emerald-400',
  forecast: 'text-[var(--primary-blue)]',
  default: 'text-[var(--foreground)]',
};

export function KPICard({ title, value, subtitle, icon, trend, trendValue, accent = 'default', className }: KPICardProps) {
  return (
    <div className={clsx(
      'bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 flex flex-col gap-2',
      className,
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{title}</span>
        {icon && <span className="text-[var(--muted-foreground)]">{icon}</span>}
      </div>
      <div className={clsx('text-2xl font-semibold font-mono tabular-nums', accentColors[accent])}>
        {value}
      </div>
      <div className="flex items-center gap-2">
        {subtitle && <span className="text-xs text-[var(--muted-foreground)]">{subtitle}</span>}
        {trendValue && (
          <span className={clsx(
            'text-xs font-mono',
            trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-emerald-400' : 'text-[var(--muted-foreground)]',
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
