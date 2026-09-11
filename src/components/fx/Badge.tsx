import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'safe' | 'forecast' | 'observed' | 'inferred' | 'recommendation' | 'default' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  high: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  medium: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  low: 'bg-[var(--soft-blue)]/20 text-[var(--primary-blue)] border border-[var(--soft-blue)]/40',
  safe: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  forecast: 'bg-[var(--secondary-blue)]/15 text-[var(--primary-blue)] border border-[var(--secondary-blue)]/30',
  observed: 'bg-[var(--soft-blue)]/20 text-[var(--primary-blue)] border border-[var(--soft-blue)]/40',
  inferred: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  recommendation: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  default: 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]',
  outline: 'bg-transparent text-[var(--muted-foreground)] border border-[var(--border)]',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-mono uppercase tracking-wider font-medium',
      size === 'sm' ? 'text-[10px] px-1.5 py-0.5 rounded-sm' : 'text-xs px-2 py-1 rounded',
      variantStyles[variant],
      className,
    )}>
      {children}
    </span>
  );
}

export function RiskBadge({ score, className }: { score: number; className?: string }) {
  const norm = score > 1 ? score / 100 : score;
  const variant = norm >= 0.8 ? 'critical' : norm >= 0.6 ? 'high' : norm >= 0.4 ? 'medium' : norm >= 0.2 ? 'low' : 'safe';
  const label = norm >= 0.8 ? 'CRITICAL' : norm >= 0.6 ? 'HIGH' : norm >= 0.4 ? 'MEDIUM' : norm >= 0.2 ? 'LOW' : 'SAFE';
  return <Badge variant={variant} className={className}>{label}</Badge>;
}

export function LabelBadge({ label, className }: { label: 'observed' | 'inferred' | 'forecast' | 'recommendation'; className?: string }) {
  const labels = { observed: 'OBSERVED', inferred: 'INFERRED', forecast: 'FORECAST', recommendation: 'RECOMMENDATION' };
  return <Badge variant={label} className={className}>{labels[label]}</Badge>;
}
