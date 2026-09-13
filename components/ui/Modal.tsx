'use client';

import { useEffect, useRef, type ReactNode, forwardRef, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  children: ReactNode;
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open,
      onClose,
      title,
      description,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (open) {
        previousActiveElement.current = document.activeElement as HTMLElement;
        document.body.style.overflow = 'hidden';
        contentRef.current?.focus();
      } else {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!closeOnEscape) return;
        if (e.key === 'Escape') onClose();
      };

      if (open) {
        document.addEventListener('keydown', handleKeyDown);
      }
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, onClose);

    if (!open) return null;

    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-4xl',
    };

    const modalContent = (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'animate-in fade-in-0 duration-200'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-nano-black/60 backdrop-blur-sm"
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={contentRef}
          tabIndex={-1}
          className={cn(
            'relative w-full bg-surface rounded-2xl border border-border shadow-[0_25px_80px_-20px_rgb(5,6,7,0.2)]',
            'animate-in zoom-in-95 fade-in-0 duration-200',
            sizes[size],
            className
          )}
          {...props}
        >
          {(title || description) && (
            <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-nano-blue/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nano-blue/50"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </div>
      </div>
    );

    if (typeof window === 'undefined') return null;
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

export { Modal };