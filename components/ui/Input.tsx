'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id: providedId,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className={cn('w-full', fullWidth && 'max-w-full')}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
            {required && (
              <span className="text-signal-red ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full bg-surface border rounded-xl transition-all duration-200',
              'placeholder:text-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-nano-blue/30 focus:border-nano-blue',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'text-foreground',
              leftIcon ? 'pl-12' : 'pl-4',
              rightIcon ? 'pr-12' : 'pr-4',
              'py-3 text-base',
              error
                ? 'border-signal-red/50 focus:ring-signal-red/30 focus:border-signal-red'
                : 'border-border hover:border-nano-blue/30',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : hint ? hintId : undefined
            }
            disabled={disabled}
            required={required}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-sm text-signal-red flex items-center gap-1" role="alert">
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-2 text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      fullWidth = true,
      id: providedId,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className={cn('w-full', fullWidth && 'max-w-full')}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground mb-2"
          >
            {label}
            {required && (
              <span className="text-signal-red ml-1" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-surface border rounded-xl transition-all duration-200 resize-none',
            'placeholder:text-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-nano-blue/30 focus:border-nano-blue',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'text-foreground',
            'p-4 text-base',
            'min-h-[100px]',
            error
              ? 'border-signal-red/50 focus:ring-signal-red/30 focus:border-signal-red'
              : 'border-border hover:border-nano-blue/30',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          disabled={disabled}
          required={required}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-2 text-sm text-signal-red flex items-center gap-1" role="alert">
            <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-2 text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input };