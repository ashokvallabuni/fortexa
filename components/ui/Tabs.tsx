'use client';

import { useState, forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  onChange?: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, onChange, variant = 'default', children, ...props }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    const handleChange = (value: string) => {
      setActiveTab(value);
      onChange?.(value);
    };

    return (
      <div ref={ref} className={cn(className)} {...props}>
        <TabsContext.Provider value={{ activeTab, onChange: handleChange, variant }}>
          {children}
        </TabsContext.Provider>
      </div>
    );
  }
);

const TabsContext = require('react').createContext<{
  activeTab: string;
  onChange: (value: string) => void;
  variant: 'default' | 'pills' | 'underline';
} | null>(null);

function useTabsContext() {
  const context = require('react').useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within Tabs');
  }
  return context;
}

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'flex gap-1',
        variant === 'pills' && 'bg-surface p-1 rounded-xl border border-border',
        variant === 'underline' && 'border-b border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  disabled?: boolean;
}

const variantStyles = {
  default: '',
  pills: '',
  underline: '',
};

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, children, ...props }, ref) => {
    const { activeTab, onChange, variant } = useTabsContext();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`${value}-panel`}
        id={`${value}-trigger`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => !disabled && onChange(value)}
        className={cn(
          'relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nano-blue/50 focus-visible:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          isActive
            ? variant === 'pills'
              ? 'bg-nano-blue text-nano-black shadow-[0_4px_16px_-4px_rgb(88,199,255,0.4)]'
              : variant === 'underline'
              ? 'text-nano-blue'
              : 'bg-nano-blue/10 text-nano-blue'
            : 'text-muted hover:text-foreground hover:bg-nano-blue/5',
          className
        )}
        {...props}
      >
        {children}
        {variant === 'underline' && isActive && (
          <span
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-nano-blue rounded-full"
            aria-hidden="true"
          />
        )}
      </button>
    );
  }
);

TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();
    const isActive = activeTab === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${value}-panel`}
        aria-labelledby={`${value}-trigger`}
        tabIndex={0}
        className={cn('mt-4 animate-in', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = 'TabsContent';

Tabs.displayName = 'Tabs';

export { Tabs };