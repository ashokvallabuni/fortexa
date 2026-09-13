'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'danger' | 'warning';
  children?: NavItem[];
}

export interface NavigationProps {
  items: NavItem[];
  logo?: ReactNode;
  logoHref?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onSearch?: (query: string) => void;
}

export function Navigation({
  items,
  logo,
  logoHref = '/',
  user,
  onSearch,
}: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="mx-auto max-w-full px-4 md:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <Link
              href={logoHref}
              className="flex items-center gap-2 shrink-0"
              aria-label="FORTEXA Home"
            >
              {logo || (
                <svg className="h-8 w-8 text-nano-blue" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect x="2" y="2" width="28" height="28" rx="6" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 16 L14 12 L18 16 L22 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
              <span className="text-xl font-bold text-foreground tracking-tight hidden sm:block">
                FORTEXA
              </span>
            </Link>

            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {items.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl text-sm text-muted hover:text-foreground hover:border-nano-blue/30 transition-all"
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-nano-blue/10 text-nano-blue rounded">
                  <span>⌘</span>K
                </kbd>
              </button>

              {searchOpen && (
                <form onSubmit={handleSearch} className="absolute right-0 top-full mt-2 w-80 animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="relative">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search threats, nodes, alerts..."
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-nano-blue/30 focus:border-nano-blue"
                      autoFocus
                      aria-label="Search"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                </form>
              )}
            </div>

            {user && (
              <div className="hidden md:flex md:items-center md:gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted">{user.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-nano-blue/10 flex items-center justify-center text-nano-blue font-medium">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-xl text-muted hover:text-foreground hover:bg-nano-blue/10 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <NavLink key={item.href} item={item} isActive={isActive(item.href)} mobile={true} />
              ))}
            </div>
            {user && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted">{user.role}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-nano-blue/10 flex items-center justify-center text-nano-blue font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({ item, isActive, mobile = false }: { item: NavItem; isActive: boolean; mobile?: boolean }) {
  const [subOpen, setSubOpen] = useState(false);

  if (item.children && item.children.length > 0) {
    return (
      <div className="relative">
        <button
          onClick={() => setSubOpen(!subOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
            isActive
              ? 'text-nano-blue bg-nano-blue/10'
              : mobile
              ? 'text-foreground hover:bg-nano-blue/5'
              : 'text-muted hover:text-foreground hover:bg-nano-blue/5',
            mobile && 'w-full justify-between'
          )}
          aria-expanded={subOpen}
          aria-label={item.label}
        >
          {item.icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{item.icon}</span>}
          <span>{item.label}</span>
          {item.badge !== undefined && (
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              item.badgeVariant === 'danger' && 'bg-signal-red/15 text-signal-red',
              item.badgeVariant === 'warning' && 'bg-amber-500/15 text-amber-500',
              'bg-nano-blue/15 text-nano-blue'
            )}>
              {item.badge}
            </span>
          )}
          <svg className={cn('h-4 w-4 transition-transform', subOpen && 'rotate-180')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {subOpen && (
          <div className={cn(
            'mt-1 pl-6 animate-in fade-in-0 slide-in-from-top-2 duration-150',
            mobile && 'ml-4 border-l border-border/50'
          )}>
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors',
                  isActive(child.href)
                    ? 'text-nano-blue bg-nano-blue/10'
                    : 'text-muted hover:text-foreground hover:bg-nano-blue/5'
                )}
              >
                {child.icon && <span className="h-4 w-4" aria-hidden="true">{child.icon}</span>}
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'text-nano-blue bg-nano-blue/10'
          : mobile
          ? 'text-foreground hover:bg-nano-blue/5'
          : 'text-muted hover:text-foreground hover:bg-nano-blue/5',
        mobile && 'w-full'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {item.icon && <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">{item.icon}</span>}
      <span>{item.label}</span>
      {item.badge !== undefined && (
        <span className={cn(
          'px-2 py-0.5 text-xs font-medium rounded-full',
          item.badgeVariant === 'danger' && 'bg-signal-red/15 text-signal-red',
          item.badgeVariant === 'warning' && 'bg-amber-500/15 text-amber-500',
          'bg-nano-blue/15 text-nano-blue'
        )}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}