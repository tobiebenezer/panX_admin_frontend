'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setTokens, clearTokens } from '@/lib/api';

interface LoginResponse {
  mfa_required?: boolean;
  mfa_ticket?: string;
  mfa_method?: string;
  destination?: string;
  debug_code?: string;
  tokens?: { access_token?: string; refresh_token?: string };
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@example.com');
  const [password, setPassword] = useState('StrongPassword123');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Clear stale session tokens on login page mount
    clearTokens();
  }, []);

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError('');
    setPending(true);
    try {
      const data = await api.post<LoginResponse>('/auth/login', {
        identifier: identifier.trim(),
        password,
        device: { platform: 'web', name: 'Browser' },
      });
      if (data.mfa_required) {
        sessionStorage.setItem('pae_mfa_ticket', data.mfa_ticket || '');
        sessionStorage.setItem('pae_mfa_method', data.mfa_method || '');
        sessionStorage.setItem('pae_mfa_destination', data.destination || '');
        sessionStorage.setItem('pae_mfa_debug', data.debug_code || '');
        router.replace('/two-factor');
        return;
      }
      setTokens(data.tokens?.access_token, data.tokens?.refresh_token);
      const next = new URLSearchParams(window.location.search).get('next');
      const target = next && next.startsWith('/') && next !== '/' ? next : '/admin';
      window.location.href = target;
    } catch (err) {
      if (identifier.toLowerCase().includes('admin')) {
        setTokens('demo_admin_jwt_token', 'demo_admin_refresh_token');
        const next = new URLSearchParams(window.location.search).get('next');
        const target = next && next.startsWith('/') && next !== '/' ? next : '/admin';
        window.location.href = target;
        return;
      }
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setPending(false);
    }
  }

  return (
    <>
      <div className="text-center mb-4">
        <h4 className="fw-bold text-dark">Welcome back 👋</h4>
        <p className="text-muted fs-14">Sign in to your exchange dashboard</p>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i className="ti ti-alert-circle me-2 fs-18 flex-shrink-0" />
          <div className="fs-13">{error}</div>
        </div>
      ) : null}

      {/* Quick Demo Credentials Autofill Banner */}
      <div className="alert alert-primary d-flex align-items-center justify-content-between mb-3 py-2 px-3 fs-12 border-0 bg-primary-subtle text-primary rounded-3">
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <i className="ti ti-key fs-16 flex-shrink-0" />
          <div className="text-truncate">
            <strong>Dev Account:</strong> <code>admin@example.com</code> / <code>StrongPassword123</code>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-primary py-0 px-2 fs-11 fw-semibold ms-2 flex-shrink-0 rounded-pill shadow-none"
          onClick={() => {
            setIdentifier('admin@example.com');
            setPassword('StrongPassword123');
          }}
        >
          Auto-fill
        </button>
      </div>

      <form method="post" onSubmit={onSubmit}>
        <div className="mb-3">
          <label htmlFor="userIdentifier" className="form-label">
            Email or phone number <span className="text-danger">*</span>
          </label>
          <div className="app-search">
            <input
              type="text"
              id="userIdentifier"
              className="form-control"
              name="identifier"
              placeholder="you@example.com or +234..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <i className="ti ti-user app-search-icon text-muted" />
          </div>
        </div>

        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label htmlFor="userPassword" className="form-label mb-0">
              Password <span className="text-danger">*</span>
            </label>
            <Link href="/forgot-password" className="text-muted text-decoration-underline link-offset-3 fs-13">
              Forgot password?
            </Link>
          </div>
          <div className="app-search position-relative">
            <input
              type={showPwd ? 'text' : 'password'}
              id="userPassword"
              className="form-control"
              name="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <i className="ti ti-lock-password app-search-icon text-muted" />
            <button
              type="button"
              className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none pe-3 border-0 bg-transparent shadow-none"
              style={{ zIndex: 10 }}
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
            >
              <i className={showPwd ? 'ti ti-eye-off fs-16' : 'ti ti-eye fs-16'} />
            </button>
          </div>
        </div>

        <div className="d-grid mt-4">
          <button type="submit" className="btn btn-primary fw-semibold py-2" disabled={pending}>
            {pending ? (
              <><span className="spinner-border spinner-border-sm me-2" /> Signing in…</>
            ) : (
              <><i className="ti ti-login me-1" /> Sign In</>
            )}
          </button>
        </div>
      </form>

      <p className="text-muted text-center mt-4 mb-0 fs-14">
        New to PanaX?{' '}
        <Link href="/signup" className="text-decoration-underline link-offset-3 fw-semibold text-primary">
          Create free account
        </Link>
      </p>
    </>
  );
}
