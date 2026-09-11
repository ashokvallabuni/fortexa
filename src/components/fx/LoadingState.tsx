import React from 'react';
import { clsx } from 'clsx';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <span className={clsx('size-4 border-2 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin inline-block', className)} />
  );
}

export function LoadingCard({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx('bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 bg-[var(--muted)] rounded animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner className="size-8" />
        <p className="text-xs text-[var(--muted-foreground)] font-mono">LOADING DATA...</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {icon && <div className="text-[var(--muted-foreground)] mb-2">{icon}</div>}
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      {description && <p className="text-xs text-[var(--muted-foreground)] max-w-xs">{description}</p>}
    </div>
  );
}
