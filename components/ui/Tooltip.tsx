'use client';

import { useState, useRef, useEffect, type ReactNode, forwardRef, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      position = 'top',
      delay = 150,
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const show = () => {
      timeoutRef.current = setTimeout(() => setVisible(true), delay);
    };

    const hide = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setVisible(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    if (!triggerRef.current) return <>{children}</>;

    const positions = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrows = {
      top: 'top-full left-1/2 -translate-x-1/2 border-t-nano-blue/90',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-nano-blue/90',
      left: 'right-full top-1/2 -translate-y-1/2 border-l-nano-blue/90',
      right: 'left-full top-1/2 -translate-y-1/2 border-r-nano-blue/90',
    };

    const tooltip = visible && (
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-50 px-3 py-2 text-xs font-medium text-white bg-nano-black/90 backdrop-blur-sm rounded-lg shadow-[0_10px_40px_-10px_rgb(5,6,7,0.3)]',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          'pointer-events-none',
          positions[position]
        )}
        role="tooltip"
        aria-hidden="false"
      >
        {content}
        <div
          className={cn(
            'absolute w-0 h-0 border-4 border-transparent',
            arrows[position]
          )}
          aria-hidden="true"
        />
      </div>
    );

    return (
      <>
        <span
          ref={triggerRef}
          className={cn('inline-block', className)}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {children}
        </span>
        {typeof window !== 'undefined' && tooltip && createPortal(tooltip, document.body)}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };