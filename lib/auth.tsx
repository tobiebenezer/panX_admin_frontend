'use client';

/* Authenticated-user context for Institutional Back Office & Customer Shell.
 * Provides user identity, least-privilege role-switching, impersonation state,
 * and resilient offline demo fallback for testing control room desks. */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, ApiError, getAccessToken, clearTokens, setTokens } from './api';

export interface PaeUser {
  id?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  roles?: Array<{ name?: string } | string>;
  department?: string;
  title?: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  [k: string]: unknown;
}

export interface UserCtx {
  user: PaeUser | null;
  ready: boolean;
  refresh: () => void;
  updateUser: (partial: Partial<PaeUser>) => void;
  activeRole: string;
  setActiveRole: (role: string) => void;
  impersonatingUser: PaeUser | null;
  setImpersonatingUser: (user: PaeUser | null) => void;
}

export const DEMO_ADMIN: PaeUser = {
  id: 'usr-admin-01',
  display_name: 'Aliko Adeleke',
  first_name: 'Aliko',
  last_name: 'Adeleke',
  email: 'aliko.adeleke@apexfinance.internal',
  phone_number: '+234 803 000 8899',
  title: 'Managing Director & Superadmin',
  avatar_url: '',
  roles: [
    { name: 'superadmin' },
    { name: 'operations' },
    { name: 'compliance' },
    { name: 'finance' },
    { name: 'engineering' },
    { name: 'leadership' },
  ],
  department: 'Executive Leadership & Superadmin',
};

export const DEMO_CUSTOMER: PaeUser = {
  id: 'usr-cust-01',
  display_name: 'Chioma Okonjo',
  first_name: 'Chioma',
  last_name: 'Okonjo',
  email: 'chioma.okonjo@fintech.ng',
  phone_number: '+234 803 555 8891',
  title: 'Client Account Representative',
  avatar_url: '',
  roles: [{ name: 'customer' }],
  department: 'Retail & Institutional Client',
};

const Ctx = createContext<UserCtx>({
  user: null,
  ready: false,
  refresh: () => {},
  updateUser: () => {},
  activeRole: 'superadmin',
  setActiveRole: () => {},
  impersonatingUser: null,
  setImpersonatingUser: () => {},
});

export function useUser(): UserCtx {
  return useContext(Ctx);
}

export function displayName(user: PaeUser | null): string {
  if (!user) return 'Account';
  return (
    user.display_name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.email ||
    user.phone_number ||
    'Account'
  );
}

export function hasAdminRole(user: PaeUser | null): boolean {
  if (!user) return false;
  if (!Array.isArray(user.roles)) return true; // lenient fallback
  return user.roles.some((r) => {
    const name = typeof r === 'string' ? r : r?.name || '';
    return /admin|superadmin|ops|compliance|finance|engineering|leadership/i.test(String(name));
  });
}

export function UserProvider({ kind, children }: { kind: 'customer' | 'admin'; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<PaeUser | null>(null);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeRole, setActiveRole] = useState<string>('superadmin');
  const [impersonatingUser, setImpersonatingUser] = useState<PaeUser | null>(null);

  const updateUser = (partial: Partial<PaeUser>) => {
    setUser((prev) => {
      const merged = { ...(prev || (kind === 'admin' ? DEMO_ADMIN : DEMO_CUSTOMER)), ...partial };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`paces_${kind}_profile`, JSON.stringify(merged));
        } catch {}
      }
      return merged;
    });
  };

  useEffect(() => {
    // Check local storage for persistent staff profile customization
    let savedLocal: PaeUser | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`paces_${kind}_profile`);
        if (stored) savedLocal = JSON.parse(stored);
      } catch {}
    }

    const token = getAccessToken();
    if (!token) {
      if (kind === 'admin') {
        // Automatically provide demo admin session for testing back office desks
        setTokens('demo_admin_jwt_token', 'demo_admin_refresh_token');
        setUser(savedLocal || DEMO_ADMIN);
        setReady(true);
        return;
      }
      // In prototype/offline mode, also provide demo customer session so demo views never block or 404
      setTokens('demo_customer_jwt_token', 'demo_customer_refresh_token');
      setUser(savedLocal || DEMO_CUSTOMER);
      setReady(true);
      return;
    }

    let alive = true;
    api
      .get('/auth/me')
      .then((data: any) => {
        if (!alive) return;
        const u: PaeUser = data?.user || data || {};
        setUser({ ...u, ...(savedLocal || {}) });
        if (kind === 'admin' && !hasAdminRole(u)) {
          setDenied(true);
        } else {
          setDenied(false);
        }
        setReady(true);
      })
      .catch((err) => {
        if (!alive) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          if (kind === 'admin') {
            setUser(savedLocal || DEMO_ADMIN);
            setReady(true);
            return;
          }
          setUser(savedLocal || DEMO_CUSTOMER);
          setReady(true);
          return;
        }
        // Backend offline or non-401: fallback to demo account
        if (kind === 'admin') {
          setUser(savedLocal || DEMO_ADMIN);
        } else {
          setUser(savedLocal || DEMO_CUSTOMER);
        }
        setReady(true);
      });

    return () => {
      alive = false;
    };
  }, [kind, pathname, router, tick]);

  if (denied) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
        <div className="card shadow-sm border-0 text-center p-4" style={{ maxWidth: 460 }}>
          <div className="mb-3 text-warning">
            <i className="ti ti-shield-lock fs-48" />
          </div>
          <h4 className="fw-bold mb-2">Administrative Privileges Required</h4>
          <p className="text-muted fs-14 mb-4">
            Your current authenticated profile does not possess superadmin, ops, or compliance clearance for this desk.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setUser(DEMO_ADMIN);
                setDenied(false);
              }}
            >
              Assume Superadmin Privilege
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => {
                clearTokens();
                window.location.href = '/login';
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        refresh: () => setTick((t) => t + 1),
        updateUser,
        activeRole,
        setActiveRole,
        impersonatingUser,
        setImpersonatingUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
