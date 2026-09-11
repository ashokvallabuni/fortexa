/**
 * Thin compatibility layer so the ported pages can keep using the
 * `Link` / `NavLink` / `useNavigate` / `useLocation` API surface while the
 * app actually runs on TanStack Router.
 */
import type { ReactNode } from "react";
import {
  Link as TanstackLink,
  Outlet,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
} from "@tanstack/react-router";

export { Outlet };

type LinkProps = {
  to: string;
  children?: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  [key: string]: unknown;
};

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <TanstackLink to={to} {...rest}>
      {children as ReactNode}
    </TanstackLink>
  );
}

type NavLinkProps = {
  to: string;
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
  children?: ReactNode | ((state: { isActive: boolean }) => ReactNode);
  title?: string;
  [key: string]: unknown;
};

export function NavLink({ to, end, className, children, ...rest }: NavLinkProps) {
  const { pathname } = useTanstackLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClass = typeof className === "function" ? className({ isActive }) : className;

  return (
    <TanstackLink to={to} className={resolvedClass} {...rest}>
      {typeof children === "function" ? children({ isActive }) : children}
    </TanstackLink>
  );
}

export function useLocation() {
  const location = useTanstackLocation();
  return { pathname: location.pathname, search: location.searchStr, hash: location.hash };
}

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return (to: string | number) => {
    if (typeof to === "number") {
      if (typeof window !== "undefined") window.history.go(to);
      return;
    }
    void navigate({ to });
  };
}
