import { clsx } from 'clsx';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-[var(--secondary-blue)] text-white hover:bg-[var(--primary-blue)] border border-[var(--secondary-blue)]',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)] border border-[var(--border)]',
  ghost: 'bg-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] border border-transparent',
  danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30',
  outline: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)] border border-[var(--border)]',
};

const sizes = {
  sm: 'text-xs px-2.5 py-1.5 h-7',
  md: 'text-sm px-3.5 py-2 h-9',
  lg: 'text-sm px-5 py-2.5 h-10',
};

export function Button({ children, variant = 'secondary', size = 'md', isLoading, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
