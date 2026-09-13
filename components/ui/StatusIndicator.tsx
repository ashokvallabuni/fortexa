'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'online' | 'offline' | 'warning' | 'critical' | 'unknown' | 'processing';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  pulse?: boolean;
}

const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  (
    {
      className,
      status,
      size = 'md',
      label,
      pulse = true,
      children,
      ...props
    },
    ref
  ) => {
    const statusConfig = {
      online: { color: 'bg-emerald-500', label: 'Online', pulseColor: 'emerald-500' },
      offline: { color: 'bg-muted', label: 'Offline', pulseColor: 'transparent' },
      warning: { color: 'bg-amber-500', label: 'Warning', pulseColor: 'amber-500' },
      critical: { color: 'bg-signal-red', label: 'Critical', pulseColor: 'signal-red' },
      unknown: { color: 'bg-muted', label: 'Unknown', pulseColor: 'transparent' },
      processing: { color: 'bg-nano-blue', label: 'Processing', pulseColor: 'nano-blue' },
    };

    const config = statusConfig[status];
    const sizes = {
      sm: { dot: 'h-2 w-2', label: 'text-xs', gap: 'gap-1.5' },
      md: { dot: 'h-2.5 w-2.5', label: 'text-sm', gap: 'gap-2' },
      lg: { dot: 'h-3 w-3', label: 'text-base', gap: 'gap-2.5' },
    };

    const sizeConfig = sizes[size];

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center', sizeConfig.gap, className)}
        {...props}
      >
        <span
          className={cn(
            'relative flex-shrink-0 rounded-full',
            config.color,
            sizeConfig.dot
          )}
          aria-hidden="true"
        >
          {pulse && status !== 'offline' && status !== 'unknown' && (
            <span
              className={cn(
                'absolute inset-0 rounded-full animate-ping opacity-75',
                config.pulseColor !== 'transparent' && `bg-[${config.pulseColor}]`
              )}
              style={{
                backgroundColor: config.pulseColor !== 'transparent' ? `var(--${config.pulseColor.replace('-500', '')})` : 'transparent'
              }}
              aria-hidden="true"
            />
          )}
        </span>
        {(label || children) && (
          <span className={cn('font-medium', sizeConfig.label)}>
            {label || config.label}
          </span>
        )}
      </span>
    );
  }
);

StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator };