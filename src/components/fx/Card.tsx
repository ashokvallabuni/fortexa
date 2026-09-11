import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export function Card({ children, className, padding = 'md', bordered = true }: CardProps) {
  return (
    <div className={clsx(
      'bg-[var(--card)] rounded-[var(--radius)]',
      bordered && 'border border-[var(--border)]',
      padding === 'none' && '',
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-4',
      padding === 'lg' && 'p-6',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider', className)}>
      {children}
    </h3>
  );
}

export function CardSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx('text-xs text-[var(--muted-foreground)] mt-0.5', className)}>
      {children}
    </p>
  );
}
