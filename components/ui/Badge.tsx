'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulsing?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      pulsing = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-nano-blue/15 text-nano-blue border-nano-blue/20',
      success: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
      warning: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
      danger: 'bg-signal-red/15 text-signal-red border-signal-red/20',
      info: 'bg-deep-blue/15 text-deep-blue border-deep-blue/20',
      neutral: 'bg-muted/15 text-muted border-muted/20',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-1 text-xs gap-1.5',
      lg: 'px-3 py-1.5 text-sm gap-2',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full border',
          variants[variant],
          sizes[size],
          pulsing && 'animate-pulse',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full',
              variant === 'success' && 'bg-emerald-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'danger' && 'bg-signal-red',
              variant === 'info' && 'bg-deep-blue',
              variant === 'default' && 'bg-nano-blue',
              variant === 'neutral' && 'bg-muted',
              sizes[size] === 'px-2 py-0.5 text-xs gap-1' && 'h-1.5 w-1.5',
              sizes[size] === 'px-2.5 py-1 text-xs gap-1.5' && 'h-2 w-2',
              sizes[size] === 'px-3 py-1.5 text-sm gap-2' && 'h-2.5 w-2.5',
              pulsing && 'animate-pulse'
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };