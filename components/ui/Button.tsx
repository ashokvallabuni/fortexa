'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  magnetic?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      magnetic = true,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      relative inline-flex items-center justify-center gap-2
      font-medium transition-all duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nano-blue/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
      select-none
    `;

    const variants = {
      primary: `
        bg-nano-blue text-nano-black shadow-[0_4px_20px_-4px_rgb(88,199,255,0.4)]
        hover:shadow-[0_8px_30px_-6px_rgb(88,199,255,0.5)] hover:brightness-105
        active:scale-[0.98] active:shadow-[0_2px_10px_-4px_rgb(88,199,255,0.4)]
        ${magnetic ? 'magnetic-hover' : ''}
      `,
      secondary: `
        bg-surface text-foreground border border-border
        hover:bg-nano-blue/10 hover:border-nano-blue/30 hover:text-nano-blue
        active:bg-nano-blue/15 active:scale-[0.98]
        ${magnetic ? 'magnetic-hover' : ''}
      `,
      ghost: `
        bg-transparent text-foreground
        hover:bg-nano-blue/10 hover:text-nano-blue
        active:bg-nano-blue/15 active:scale-[0.98]
      `,
      danger: `
        bg-signal-red text-white shadow-[0_4px_20px_-4px_rgb(227,27,35,0.4)]
        hover:shadow-[0_8px_30px_-6px_rgb(227,27,35,0.5)] hover:brightness-105
        active:scale-[0.98] active:shadow-[0_2px_10px_-4px_rgb(227,27,35,0.4)]
        ${magnetic ? 'magnetic-hover' : ''}
      `,
      outline: `
        bg-transparent text-nano-blue border border-nano-blue/30
        hover:bg-nano-blue/10 hover:border-nano-blue
        active:bg-nano-blue/15 active:scale-[0.98]
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
      md: 'px-5 py-2.5 text-base gap-2 rounded-xl',
      lg: 'px-7 py-3.5 text-lg gap-2.5 rounded-xl',
      xl: 'px-10 py-4.5 text-xl gap-3 rounded-2xl',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], widthStyle, className)}
        style={style}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
            <span className="relative z-10">{children}</span>
            {rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
        <span className="scan-line" aria-hidden="true" />
        <span className="magnetic-glow" aria-hidden="true" />
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };